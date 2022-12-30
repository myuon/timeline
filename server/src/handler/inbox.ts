import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { domain, userId, userName } from "../config";
import dayjs from "dayjs";

export const follow = async (app: App, ctx: Context, activity: Activity) => {
  if (activity.target !== `https://${domain}/u/${userName}`) {
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
    type: "Accept",
    actor: `https://${domain}/u/${userId}`,
    object: activity,
  };
};
