// Schema:
import { UserToken } from "../../generated/schema";

// Helper:
import { ZERO_BI } from "../utils/constants.template";
import { getNiftyzoneTokenEntityId, setSyncingIndex } from "../utils/helper";

export function getUserToken(
  user: string,
  tokenId: string,
  contractAddress: string
): UserToken {
  let id = user + "-" + tokenId;
  let userToken = UserToken.load(id);

  if (!userToken) {
    userToken = new UserToken(id);

    let tokenEntityId = getNiftyzoneTokenEntityId(contractAddress, tokenId);

    userToken.user = user;
    userToken.token = tokenEntityId;
    userToken.totalSent = ZERO_BI;
    userToken.totalReceived = ZERO_BI;
    userToken.balance = ZERO_BI;
    setSyncingIndex("userTokens", userToken);

    userToken.save();
  }

  return userToken;
}
