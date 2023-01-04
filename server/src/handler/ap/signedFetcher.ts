import { fetcher } from "../../helper/fetcher";
import { signHttpHeaders } from "../../helper/signature";

export const signedFetcher = async (
  signKey: {
    privateKey: Buffer;
    keyId: string;
  },
  url: string,
  init: { method: string; body: object }
) => {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    signKey.privateKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return fetcher(url, {
    method: init.method,
    body: JSON.stringify(init.body),
    headers: {
      ...(await signHttpHeaders(key, {
        keyId: signKey.keyId,
        body: init.body,
        path: new URL(url).pathname,
        method: init.method,
      })),
      Accept: "application/activity+json",
    },
  });
};
