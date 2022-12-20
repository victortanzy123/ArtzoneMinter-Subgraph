// Schema:
import { User } from "../../generated/schema";

// Constants/Helper:
import { setSyncingIndex } from "../utils/helper";

export function getUser(address: string): User {
  let user = User.load(address);

  if (!user) {
    user = new User(address);
    setSyncingIndex("users", user);
    user.save();
  }

  return user;
}
