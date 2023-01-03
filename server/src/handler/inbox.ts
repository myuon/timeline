import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { domain, userName } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import fs from "fs";
import path from "path";
import { webcrypto as crypto } from "crypto";
import fetch from "node-fetch";
import https from "https";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const pemToBuffer = (pem: string) => {
  const lines = pem.split("\n");
  const encoded = lines
    .filter(
      (line) =>
        !line.match(/(-----(BEGIN|END) (PUBLIC|PRIVATE) KEY-----)/) &&
        Boolean(line)
    )
    .join("");
  return Buffer.from(encoded, "base64");
};

const privateKey = pemToBuffer(
  fs.readFileSync(
    path.join(__dirname, "../../../.secrets/private.pem"),
    "utf-8"
  )
);

const signHeaders = async (path: string, body: object) => {
  const now = new Date().toUTCString();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(body))
  );
  const digestString = Buffer.from(digest).toString("base64");

  const signedString = [
    `(request-target): post ${path}`,
    `date: ${now}`,
    `digest: SHA-256=${digestString}`,
  ].join("\n");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signedString)
  );

  return {
    Signature: [
      `keyId="https://${domain}/u/${userName}#main-key"`,
      `algorithm="rsa-sha256"`,
      `headers="(request-target) date digest"`,
      `signature="${Buffer.from(signature).toString("base64")}"`,
    ].join(","),
    Date: now,
    Digest: `SHA-256=${digestString}`,
  };
};

export const follow = async (app: App, ctx: Context, activity: Activity) => {
  if (activity.object !== `https://${domain}/u/${userName}`) {
    ctx.throw(400, "Bad request");
  }

  if (!activity.actor) {
    ctx.throw(400, "Bad request");
  }

  const followRelation = {
    userUrl: activity.actor,
    targetUserUrl: `https://${domain}/u/${userName}`,
    createdAt: dayjs().unix(),
  };
  await app.followRelationRepository.create(followRelation);

  const document = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${domain}/u/${userName}/s/${ulid()}`,
    type: "Accept",
    actor: `https://${domain}/u/${userName}`,
    object: activity,
  };

  ctx.body = document;
  ctx.set({
    ...(await signHeaders("/inbox", document)),
  });
};

export const helloworld = async (app: App, ctx: Context) => {
  const id = ulid();
  const publishedAt = dayjs.utc().toISOString();
  const document = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${domain}/u/${userName}/s/${id}/activity`,
    type: "Create",
    actor: `https://${domain}/u/${userName}`,
    published: publishedAt,
    object: {
      id: `https://${domain}/u/${userName}/s/${id}`,
      type: "Note",
      to: "https://www.w3.org/ns/activitystreams#Public",
      published: publishedAt,
      content: "Hello, world!",
      inReplyTo: "https://pawoo.net/@myuon/109623755895854716",
      attributedTo: `https://${domain}/u/${userName}`,
    },
  };
  const req = {
    method: "POST",
    body: JSON.stringify(document),
    headers: {
      ...(await signHeaders("/inbox", document)),
      Accept: "application/activity+json",
    },
    agent: new https.Agent({
      rejectUnauthorized: false,
    }),
  };
  const resp = await fetch(`https://pawoo.net/inbox`, req);

  console.log(resp.status, resp.statusText);
  if (!resp.ok) {
    console.error(await resp.text());
  } else {
    console.log(await resp.text());
  }
};
