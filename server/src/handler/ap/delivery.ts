import fs from "fs";
import path from "path";
import { userIdUrl } from "../../config";

const privateKeyPemString = fs.readFileSync(
  path.join(__dirname, "../../../../.secrets/private.pem"),
  "utf-8"
);
export const signKey = {
  privateKeyPemString,
  keyId: `${userIdUrl}#main-key`,
};
