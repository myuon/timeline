import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { userId } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import fs from "fs";
import path from "path";
import { webcrypto as crypto } from "crypto";
import fetch from "node-fetch";
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
      `keyId="${userId}#main-key"`,
      `algorithm="rsa-sha256"`,
      `headers="(request-target) date digest"`,
      `signature="${Buffer.from(signature).toString("base64")}"`,
    ].join(","),
    Date: now,
    Digest: `SHA-256=${digestString}`,
  };
};

export const follow = async (app: App, ctx: Context, activity: Activity) => {
  if (activity.object !== userId) {
    ctx.throw(400, "Bad request");
  }

  if (!activity.actor) {
    ctx.throw(400, "Bad request");
  }

  const followRelation = {
    userId: activity.actor,
    targetUserId: userId,
    createdAt: dayjs().unix(),
  };
  await app.followRelationRepository.create(followRelation);

  const document = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${userId}/s/${ulid()}`,
    type: "Accept",
    actor: userId,
    object: activity,
  };

  const resp = await fetch(activity.actor, {
    headers: {
      Accept: "application/activity+json",
    },
  });
  if (!resp.ok) {
    console.error(await resp.text());
    ctx.throw(500, "Internal server error");
  }

  const json = (await resp.json()) as { inbox: string };
  ctx.log.info(`inbox: ${json.inbox}`);

  const respAccept = await fetch(json.inbox, {
    method: "POST",
    body: JSON.stringify(document),
    headers: {
      ...(await signHeaders(new URL(json.inbox).pathname, document)),
      Accept: "application/activity+json",
    },
  });
  if (!respAccept.ok) {
    console.error(await respAccept.text());
    ctx.throw(500, "Internal server error");
  }

  ctx.status = 200;
  ctx.log.info(await respAccept.text());
};
