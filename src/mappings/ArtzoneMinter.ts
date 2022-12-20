import { dataSource, json } from "@graphprotocol/graph-ts";

// Events from ABI:
import {
  TransferSingle as TransferSingleEvent,
  TransferBatch as TransferBatchEvent,
  TokenInitialisation,
  TokenMint,
} from "../../generated/ArtzoneMinter/ArtzoneMinter";

// Schemas:
import { ArtzoneToken, Transfer } from "../../generated/schema";
import {
  getArtzoneToken,
  getTokenMaximumSupply,
  getTokenMetadata,
  getTokenTotalSupply,
} from "../entities/artzoneToken";
import { getToken } from "../entities/token";
import { getUser } from "../entities/user";
import { getUserToken } from "../entities/userToken";

// Constants/Helpers:
import {
  getTransferId,
  getNiftyzoneTokenEntityId,
  setSyncingIndex,
} from "../utils/helper";

// Handle TransferSingle events:
export function handleTransferSingle(event: TransferSingleEvent): void {
  let artzoneMinter = dataSource.address().toHexString();
  let tokenId = event.params.id;

  // Retrieve or create token object:
  let token = getToken(tokenId.toString(), artzoneMinter);

  token.save();

  // Retrieve or create artzoneToken:
  let niftyzoneToken = getArtzoneToken(tokenId, artzoneMinter);

  niftyzoneToken.save();

  let hash = event.transaction.hash.toHexString();
  let index = event.logIndex;
  let blockNumber = event.block.number;
  let blockTimestamp = event.block.timestamp;
  let transferId = getTransferId(hash, index, tokenId);

  // Create new Transfer object:
  let transfer = new Transfer(transferId);
  transfer.hash = hash;
  transfer.token = token.id;
  transfer.from = event.params.from.toHexString();
  transfer.to = event.params.to.toHexString();
  transfer.value = event.params.value;
  transfer.blockNumber = blockNumber;
  transfer.timestamp = blockTimestamp;
  setSyncingIndex("transfers", transfer);

  transfer.save();

  // Update UserToken Data:
  let from = getUser(event.params.from.toHexString());
  let to = getUser(event.params.to.toHexString());

  let fromUserToken = getUserToken(from.id, tokenId.toString(), artzoneMinter);
  fromUserToken.totalSent = fromUserToken.totalSent.plus(event.params.value);
  fromUserToken.balance = fromUserToken.balance.minus(event.params.value);

  fromUserToken.save();

  let toUserToken = getUserToken(to.id, tokenId.toString(), artzoneMinter);
  toUserToken.totalReceived = toUserToken.totalReceived.plus(
    event.params.value
  );
  toUserToken.balance = toUserToken.balance.plus(event.params.value);

  toUserToken.save();
}

// Handle TransferBatch events:
export function handleTransferBatch(event: TransferBatchEvent): void {
  let artzoneMinter = dataSource.address().toHexString();
  let tokens = event.params.ids;
  let amounts = event.params.values;

  let hash = event.transaction.hash.toHexString();
  let index = event.logIndex;
  let blockNumber = event.block.number;
  let blockTimestamp = event.block.timestamp;

  // Retrieve and save all tokens in the graph node
  for (let i = 0; i < tokens.length; i++) {
    // Retrieve or create token object:
    let token = getToken(tokens[i].toString(), artzoneMinter);

    token.save();

    // Retrieve or create niftyzoneToken:
    let niftyzoneToken = getArtzoneToken(tokens[i], artzoneMinter);

    niftyzoneToken.save();

    // Create new Transfer object:
    let transferId = getTransferId(hash, index, tokens[i]);

    let transfer = new Transfer(transferId);

    transfer.hash = hash;
    transfer.token = token.id;
    transfer.from = event.params.from.toHexString();
    transfer.to = event.params.to.toHexString();
    transfer.value = amounts[i];
    transfer.blockNumber = blockNumber;
    transfer.timestamp = blockTimestamp;
    setSyncingIndex("transfers", transfer);

    transfer.save();

    // Update UserToken Data
    let from = getUser(event.params.from.toHexString());
    let to = getUser(event.params.to.toHexString());

    let fromUserToken = getUserToken(
      from.id,
      tokens[i].toString(),
      artzoneMinter
    );
    fromUserToken.totalReceived = fromUserToken.totalReceived.plus(amounts[i]);
    fromUserToken.balance = fromUserToken.balance.plus(amounts[i]);
    fromUserToken.save();
    let toUserToken = getUserToken(to.id, tokens[i].toString(), artzoneMinter);

    toUserToken.totalSent = toUserToken.totalSent.plus(amounts[i]);
    toUserToken.balance = toUserToken.balance.minus(amounts[i]);
    toUserToken.save();
  }
}

export function handleTokenInitialisation(event: TokenInitialisation): void {
  let blockTimestamp = event.block.timestamp;
  let artzoneMinter = dataSource.address().toHexString();
  let tokenId = event.params.tokenId;

  let token = getToken(tokenId.toString(), artzoneMinter);

  let niftyzoneTokenId = getNiftyzoneTokenEntityId(
    artzoneMinter,
    tokenId.toString()
  );

  // Save token on the graph node:
  let artzoneToken = new ArtzoneToken(niftyzoneTokenId);
  artzoneToken.token = token.id;
  artzoneToken.timestampCreatedAt = blockTimestamp;

  // Royalties Info get directly from event:
  artzoneToken.secondaryRoyalties = event.params.royaltyPercent;
  artzoneToken.royaltiesReceiver = event.params.royaltyAddr.toHexString();

  // Maximum total supply of tokenId
  let totalMaxSupply = getTokenMaximumSupply(artzoneMinter, tokenId);
  artzoneToken.totalMaxSupply = totalMaxSupply;

  // Total supply of tokenId
  let totalSupply = getTokenTotalSupply(artzoneMinter, tokenId);
  artzoneToken.totalSupply = totalSupply;
  // Metadata of tokenId
  let ipfsResult = getTokenMetadata(artzoneMinter, tokenId);

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

export function handleTokenMint(event: TokenMint): void {
  let artzoneMinter = dataSource.address().toHexString();

  let tokenId = event.params.tokenId;
  let quantityMinted = event.params.quantity;

  // Update Artzone Token object
  let artzoneToken = getArtzoneToken(tokenId, artzoneMinter);
  artzoneToken.totalSupply = artzoneToken.totalSupply.plus(quantityMinted);

  artzoneToken.save();
}
