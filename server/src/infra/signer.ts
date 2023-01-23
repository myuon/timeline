import { getActor } from "../handler/ap/api";
import { Context } from "../handler/app";
import { importVerifyKey, verifyHttpHeaders } from "../helper/signature";
import { FetchClient } from "./fetchClient";

export const newSigner = (fetchClient: FetchClient) => {
  return {
    verify: async (ctx: Context) => {
      const signatureHeader = ctx.request.headers.signature as
        | string
        | undefined;
      if (!signatureHeader) {
        ctx.throw(400, "Missing signature header");
      }
      const signaturePairs = signatureHeader.split(",").map((s) => {
        const pair = s.trim().split("=");
        return [pair[0], pair[1].replace(/"/g, "")];
      });

      const keyId = signaturePairs.find((p) => p[0] === "keyId")?.[1];
      if (!keyId) {
        ctx.throw(400, "Missing keyId");
      }
      const { data, error: actorError } = await getActor(
        fetchClient.fetcher,
        keyId
      );
      if (!data) {
        return "actor_gone";
      }

      const publicKeyPem = data?.publicKey?.publicKeyPem;
      if (actorError || !publicKeyPem) {
        ctx.log.info(
          `(getKeyId) data: ${JSON.stringify(data)}, error: ${JSON.stringify(
            actorError
          )}`
        );
        ctx.throw(400, "Invalid keyId");
      }

      const headers = signaturePairs.find((p) => p[0] === "headers")?.[1];
      const signature = signaturePairs.find((p) => p[0] === "signature")?.[1];
      const algorithm = signaturePairs.find((p) => p[0] === "algorithm")?.[1];

      const key = await importVerifyKey(publicKeyPem);

      const date = ctx.request.headers.date as string | undefined;
      if (!date) {
        ctx.throw(400, "Missing date header");
      }
      if (Math.abs(Date.now() - new Date(date).getTime()) > 1000 * 60 * 5) {
        ctx.log.info(`(date) date: ${date}`);
        ctx.throw(400, "Invalid date");
      }

      const { error } = await verifyHttpHeaders(
        key,
        algorithm ?? "",
        headers ?? "",
        signature ?? "",
        {
          body: ctx.request.body,
          path: ctx.request.path,
          method: ctx.request.method,
          headers: ctx.request.headers as Record<string, string | undefined>,
        }
      );
      if (error) {
        ctx.throw(400, `Verification failed: ${error}`);
      }
    },
  };
};
export type Signer = ReturnType<typeof newSigner>;
