import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

// Subgraph Variables:
const NiftyzoneMarketplaceContractAddress = "";
const NiftyzoneMarketplace_StartBlock = 0;
const NiftyzoneMinterContractAddress = "";
const NiftyzoneMinter_StartBlock = 0;

// Constants:
export const IPFS_HASH_LENGTH = 46;

export const ZERO_BI = BigInt.fromString("0");
export const ONE_BI = BigInt.fromString("1");

export const BPS_BI = BigInt.fromString("10000");

export const ZERO_BD = BigDecimal.fromString("0");
export const ONE_BD = BigDecimal.fromString("1");

export const ERC1155_INTERFACE_ID = Bytes.fromHexString("0xd9b67a26");
export const ERC721_INTERFACE_ID = Bytes.fromHexString("0x80ac58cd");
