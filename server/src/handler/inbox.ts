import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { userId } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import fs from "fs";
import path from "path";
import { pemToBuffer } from "../helper/pem";
import { getInbox } from "./ap/api";
import { signedFetcher } from "./ap/signedFetcher";

const privateKey = pemToBuffer(
  fs.readFileSync(
    path.join(__dirname, "../../../.secrets/private.pem"),
    "utf-8"
  )
);
const signKey = {
  privateKey,
  keyId: `${userId}#main-key`,
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

  const { data: inbox, error: inboxError } = await getInbox(activity.actor);
  if (!inbox) {
    console.error(inboxError);
    ctx.throw(500, "Internal server error");
  }

  const { data, error } = await signedFetcher(signKey, inbox, {
    method: "post",
    body: document,
  });
  if (error) {
    console.error(error);
    ctx.throw(500, "Internal server error");
  }
  ctx.log.info(data);

  ctx.status = 200;
};
