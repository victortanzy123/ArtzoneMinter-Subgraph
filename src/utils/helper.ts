import { BigDecimal, BigInt, Entity, Value } from "@graphprotocol/graph-ts";
import { Bundle } from "../../generated/schema";
import { ZERO_BI, ONE_BI, IPFS_HASH_LENGTH } from "./constants.template";

export interface IRoyaltyInfo {
  royaltiesAmount: BigInt;
  receiver: string;
}

export const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const NATIVE_ALT = "0x0000000000000000000000000000000000000000";

export function getNiftyzoneTokenIpfsHash(tokenUri: string): string {
  return tokenUri.slice(-IPFS_HASH_LENGTH);
}

export function getNiftyzoneTokenEntityId(
  contractAddress: string,
  tokenId: string
): string {
  return `${contractAddress}-${tokenId}`;
}

export function getTransferId(
  hash: string,
  logIndex: BigInt,
  tokenId: BigInt
): string {
  return `${hash}-${logIndex}-${tokenId}`;
}

export function getMarketItemSaleId(
  hash: string,
  logIndex: BigInt,
  listingId: BigInt
): string {
  return `${hash}-${logIndex.toString()}-${listingId.toString()}`;
}

export function getNewOfferId(
  offeror: string,
  marketplace: string,
  listingId: BigInt
): string {
  return `${offeror}-${marketplace}-${listingId}`;
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.gt(decimals as BigInt); i = i.minus(ONE_BI)) {
    bd = bd.div(BigDecimal.fromString("10"));
  }

  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function toDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals));
}

export function getNextSyncingIndex(collection: string): BigInt {
  let bundle = Bundle.load(collection);
  if (!bundle) {
    bundle = new Bundle(collection);
    bundle.syncingIndex = BigInt.fromI32(0);
  }

  let newSyncingIndex = bundle.syncingIndex.plus(ONE_BI);
  bundle.syncingIndex = newSyncingIndex;
  bundle.save();

  return newSyncingIndex;
}

export function setSyncingIndex(collection: string, entity: Entity): void {
  let syncingIndex = getNextSyncingIndex(collection);
  entity.set("syncingIndex", Value.fromBigInt(syncingIndex));
}
