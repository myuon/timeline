import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { domain, userId, userName } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const pemToBuffer = (pem: string) => {
  const lines = pem.split("\n");
  const encoded = lines
    .filter(
      (line) => !line.match(/(-----(BEGIN|END) (PUBLIC|PRIVATE) KEY-----|)/)
    )
    .join("");
  return Buffer.from(encoded, "base64");
};

const privateKey = pemToBuffer(
  fs.readFileSync(path.join(__dirname, "../../../.secrets/public.pem"), "utf-8")
);

const signHeaders = async (path: string) => {
  const now = dayjs().toISOString();
  const signedString = `(request-target): post ${path}
host: ${domain}
date: ${now}`;
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
      `headers="(request-target) host date"`,
      `signature="${Buffer.from(signature).toString("base64")}"`,
    ].join(","),
    Date: now,
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
    targetUserUrl: `https://${domain}/u/${userId}`,
    createdAt: dayjs().unix(),
  };
  await app.followRelationRepository.create(followRelation);

  ctx.body = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${domain}/u/${userId}/s/${ulid()}`,
    type: "Accept",
    actor: `https://${domain}/u/${userId}`,
    object: activity,
  };
  ctx.headers = await signHeaders("/inbox");
};

export const helloworld = async (app: App, ctx: Context) => {
  const resp = await fetch(`https://pawoo.net/inbox`, {
    body: JSON.stringify({
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `https://${domain}/u/${userId}/s/${ulid()}`,
      type: "Create",
      actor: `https://${domain}/u/${userId}`,
      object: {
        id: `https://${domain}/u/${userId}/s/${ulid()}`,
        type: "Note",
        to: "https://www.w3.org/ns/activitystreams#Public",
        published: dayjs().toISOString(),
        content: "Hello, world!",
        inReplyTo: "https://pawoo.net/@myuon/109623755895854716",
        attributedTo: `https://${domain}/u/${userId}`,
      },
    }),
    method: "POST",
    headers: {
      ...(await signHeaders("/inbox")),
    },
  });
  if (!resp.ok) {
    console.error(await resp.text());
  } else {
    console.log(await resp.text());
  }
};
