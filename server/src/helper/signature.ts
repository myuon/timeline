import { webcrypto as crypto } from "crypto";
import { pemToBuffer } from "./pem";

/* For HTTP Signatures, see:
 *   https://datatracker.ietf.org/doc/html/draft-richanna-http-message-signatures-00 (Internet-Draft)
 */

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
  signKey: crypto.CryptoKey,
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
  verifyKey: crypto.CryptoKey,
  algorithm: string,
  headersString: string,
  signature: string,
  request: {
    body: object;
    path: string;
    method: string;
    headers: Record<string, string | undefined>;
  }
) => {
  if (algorithm !== "rsa-sha256") {
    return {
      error: new Error("Only rsa-sha256 is supported"),
    };
  }

  if (!headersString.startsWith("(request-target)")) {
    return {
      error: new Error("Expect (request-target) in headers"),
    };
  }
  const headers = headersString
    .replace("(request-target)", "")
    .trim()
    .split(" ");

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
    `(request-target): ${
      // SPEC: Canonicalize the method to lower case
      request.method.toLowerCase()
    } ${request.path}`,
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
