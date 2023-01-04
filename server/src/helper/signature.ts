import { webcrypto as crypto } from "crypto";

export const signHttpHeaders = async (
  signKey: CryptoKey,
  request: {
    keyId: string;
    body: object;
    path: string;
    method: string;
  }
) => {
  const now = new Date().toUTCString();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(request.body))
  );
  const digestString = Buffer.from(digest).toString("base64");

  const signedString = [
    `(request-target): ${request.method} ${request.path}`,
    `date: ${now}`,
    `digest: SHA-256=${digestString}`,
  ].join("\n");
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signKey,
    new TextEncoder().encode(signedString)
  );

  return {
    Signature: [
      `keyId="${request.keyId}"`,
      `algorithm="rsa-sha256"`,
      `headers="(request-target) date digest"`,
      `signature="${Buffer.from(signature).toString("base64")}"`,
    ].join(","),
    Date: now,
    Digest: `SHA-256=${digestString}`,
  };
};
