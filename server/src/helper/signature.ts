import { webcrypto as crypto } from "crypto";
import { getActor } from "../handler/ap/api";
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
  headers: string[],
  signature: string,
  request: {
    body: object;
    path: string;
    method: string;
    headers: Record<string, string | undefined>;
  }
) => {
  if (!headers.includes("digest")) {
    return {
      error: new Error("Digest header is required"),
    };
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(request.body))
  );
  const digestString = Buffer.from(digest).toString("base64");
  if (request.headers.digest !== `SHA-256=${digestString}`) {
    return {
      error: new Error("Digest header is invalid"),
    };
  }

  const signedFragments = [
    `(request-target): ${request.method} ${request.path}`,
  ];
  headers.forEach((header) => {
    const value = request.headers[header];
    signedFragments.push(`${header}: ${value}`);
  });

  const signedString = signedFragments.join("\n");

  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    verifyKey,
    Buffer.from(signature, "base64"),
    new TextEncoder().encode(signedString)
  );
  if (!ok) {
    return {
      error: new Error("Signature is invalid"),
    };
  }

  return {
    error: undefined,
  };
};
