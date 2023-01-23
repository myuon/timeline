import { Fetcher } from "../infra/fetchClient";
import { importSignKey, signHttpHeaders } from "./signature";

export const signedFetcher = async (
  signKey: {
    privateKeyPemString: string;
    keyId: string;
  },
  fetcher: Fetcher,
  url: string,
  init: { method: string; body: object }
) => {
  const key = await importSignKey(signKey.privateKeyPemString);

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
