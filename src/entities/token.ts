import { Address, BigInt } from "@graphprotocol/graph-ts";
// Schemas:
import { Token } from "../../generated/schema";

// ABIs:
import { ERC721 } from "../../generated/ArtzoneMinter/ERC721";
import { ERC1155 } from "../../generated/ArtzoneMinter/ERC1155";

// Constants/Helper:
import { getNiftyzoneTokenEntityId, setSyncingIndex } from "../utils/helper";
import { ERC721_INTERFACE_ID, ERC1155_INTERFACE_ID } from "../utils/constants";

// Niftyzone Token -> ID = address-tokenId
export function getToken(tokenId: string, contractAddress: string): Token {
  let tokenEntityId = getNiftyzoneTokenEntityId(contractAddress, tokenId);

  let token = Token.load(tokenEntityId);

  if (!token) {
    token = new Token(tokenEntityId);
    token.type = getType(contractAddress);
    token.name = getName(contractAddress);
    token.symbol = getSymbol(contractAddress);
    token.tokenUri = getTokenUri(contractAddress, BigInt.fromString(tokenId));
    setSyncingIndex("tokens", token);
  }

  token.save();

  return token;
}

export function getType(address: string): string {
  let contract_721 = ERC721.bind(Address.fromString(address));
  const interface721_validity_result = contract_721.try_supportsInterface(
    ERC721_INTERFACE_ID
  );

  if (
    !interface721_validity_result.reverted &&
    interface721_validity_result.value
  ) {
    return "ERC721";
  }

  let contract_1155 = ERC1155.bind(Address.fromString(address));
  const interface1155_validity_result = contract_1155.try_supportsInterface(
    ERC1155_INTERFACE_ID
  );

  if (
    !interface1155_validity_result.reverted &&
    interface1155_validity_result.value
  ) {
    return "ERC1155";
  }

  return "UNKNOWN";
}

// Metadata helper functions:
export function getName(address: string): string {
  let contract = ERC721.bind(Address.fromString(address));
  const result = contract.try_name();

  if (result.reverted) {
    return "unknown";
  }
  return result.value;
}

export function getSymbol(address: string): string {
  let contract = ERC721.bind(Address.fromString(address));
  const result = contract.try_symbol();

  if (result.reverted) {
    return "unknown";
  }
  return result.value;
}

export function getTokenUri(address: string, tokenId: BigInt): string {
  let contract_721 = ERC721.bind(Address.fromString(address));

  const tokenUriResult = contract_721.try_tokenURI(tokenId);

  let contract_1155 = ERC1155.bind(Address.fromString(address));
  const uriResult = contract_1155.try_uri(tokenId);

  if (!tokenUriResult.reverted && uriResult.reverted) {
    return tokenUriResult.value;
  }

  if (tokenUriResult.reverted && !uriResult.reverted) {
    return uriResult.value;
  }

  return "unknown";
}
