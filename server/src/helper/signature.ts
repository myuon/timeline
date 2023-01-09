import { webcrypto as crypto } from "crypto";
import { pemToBuffer } from "./pem";

export const importSignKey = (pemString: string) =>
  crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(pemString),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

export const importVerifyKey = (pemString: string) =>
  crypto.subtle.importKey(
    "spki",
    pemToBuffer(pemString),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

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

export const verifyHttpHeaders = async (
  verifyKey: CryptoKey,
  request: {
    keyId: string;
    body: object;
    path: string;
    method: string;
    headers: {
      signature: string;
      date: string;
      digest: string;
    };
  }
) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(request.body))
  );
  const digestString = Buffer.from(digest).toString("base64");

  const signedString = [
    `(request-target): ${request.method} ${request.path}`,
    `date: ${request.headers.date}`,
    `digest: SHA-256=${digestString}`,
  ].join("\n");

  const signature = Buffer.from(
    request.headers.signature.split("=")[1],
    "base64"
  );

  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    verifyKey,
    signature,
    new TextEncoder().encode(signedString)
  );
};
