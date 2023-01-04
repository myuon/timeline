import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { userId } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import { deliveryActivity } from "./ap/delivery";

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

  const { data, error } = await deliveryActivity(activity.actor, document);
  if (error) {
    ctx.log.error(error);
    ctx.throw(500, "Internal server error");
  }
  ctx.log.info(data);

  ctx.status = 200;
};
