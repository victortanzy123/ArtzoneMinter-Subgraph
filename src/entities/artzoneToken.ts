import { Address, BigInt, Bytes, ipfs, json } from "@graphprotocol/graph-ts";

// ABIs:
import { ArtzoneMinter } from "../../generated/ArtzoneMinter/ArtzoneMinter";

// Schemas:
import { ArtzoneToken } from "../../generated/schema";

// Constants/Helper:
import { ZERO_BI, IPFS_HASH_LENGTH, BPS_BI } from "../utils/constants.template";
import { getNiftyzoneTokenEntityId } from "../utils/helper";
import {
  NATIVE,
  setSyncingIndex,
  getNiftyzoneTokenIpfsHash,
} from "../utils/helper";

export class RoyaltyInfo {
  royaltiesAmount: BigInt;
  receiver: string;

  constructor(royaltiesAmount: BigInt, receiver: string) {
    this.royaltiesAmount = royaltiesAmount;
    this.receiver = receiver;
  }
}
// Niftyzone Token -> ID = address-tokenId
export function getArtzoneToken(
  tokenId: BigInt,
  contractAddress: string
): ArtzoneToken {
  let niftyzoneTokenId = getNiftyzoneTokenEntityId(
    contractAddress,
    tokenId.toString()
  );
  // Load token from existing Graph node:
  let artzoneToken = ArtzoneToken.load(niftyzoneTokenId);
  if (!artzoneToken) {
    artzoneToken = new ArtzoneToken(niftyzoneTokenId);
    artzoneToken.token = niftyzoneTokenId;
    artzoneToken.timestampCreatedAt = ZERO_BI;

    // Royalty Info for tokenId
    let royaltyInfo = getRoyaltiesInfo(contractAddress, tokenId);

    artzoneToken.secondaryRoyalties = royaltyInfo.royaltiesAmount;
    artzoneToken.royaltiesReceiver = royaltyInfo.receiver;

    // Maximum Token Supply of tokenId
    let totalmaxSupply = getTokenMaximumSupply(contractAddress, tokenId);
    artzoneToken.totalMaxSupply = totalmaxSupply;

    // Token Supply of tokenId
    let totalSupply = getTokenTotalSupply(contractAddress, tokenId);
    artzoneToken.totalSupply = totalSupply;

    // Retrieve metadata of tokenId
    let ipfsResult = getTokenMetadata(contractAddress, tokenId);

    if (ipfsResult) {
      const metadata = json.fromBytes(ipfsResult).toObject();

      const image = metadata.get("image");
      const name = metadata.get("name");
      const description = metadata.get("description");
      const externalURL = metadata.get("external_url");
      const artist = metadata.get("artist");

      if (name && image && description && externalURL) {
        artzoneToken.name = name.toString();
        artzoneToken.image = image.toString();
        artzoneToken.externalUrl = externalURL.toString();
        artzoneToken.description = description.toString();
      }

      if (artist) {
        artzoneToken.artist = artist.toString();
      }
    }
    setSyncingIndex("artzonetokens", artzoneToken);

    artzoneToken.save();
  }

  return artzoneToken;
}

// Metadata helper functions:
export function getName(address: string): string {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_name();

  if (result.reverted) {
    return "unknown";
  }
  return result.value;
}

export function getSymbol(address: string): string {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_symbol();

  if (result.reverted) {
    return "unknown";
  }
  return result.value;
}

export function getTokenUri(address: string, tokenId: BigInt): string {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_uri(tokenId);

  if (result.reverted) {
    return "unknown";
  }
  return result.value;
}

export function getTokenMaximumSupply(
  address: string,
  tokenId: BigInt
): BigInt {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_tokenMaxSupply(tokenId);

  if (result.reverted) {
    return ZERO_BI;
  }
  return result.value;
}

export function getTokenTotalSupply(address: string, tokenId: BigInt): BigInt {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_tokenSupply(tokenId);

  if (result.reverted) {
    return ZERO_BI;
  }
  return result.value;
}

export function getRoyaltiesInfo(
  address: string,
  tokenId: BigInt
): RoyaltyInfo {
  let contract = ArtzoneMinter.bind(Address.fromString(address));
  const result = contract.try_royaltyInfo(tokenId, BPS_BI);

  if (result.reverted) {
    return new RoyaltyInfo(ZERO_BI, NATIVE);
  }

  const royaltyInfo: RoyaltyInfo = new RoyaltyInfo(
    result.value.getValue1(),
    result.value.getValue0().toHexString()
  );

  return royaltyInfo;
}

export function getTokenMetadata(
  address: string,
  tokenId: BigInt
): Bytes | null {
  let tokenUri = getTokenUri(address, tokenId);

  // Retrieve IPFS hash from tokenUri
  let metadataIpfs = getNiftyzoneTokenIpfsHash(
    tokenUri.slice(-IPFS_HASH_LENGTH)
  );

  // Get metadata from IPFS
  let metadata = ipfs.cat(metadataIpfs);

  return metadata;
}
