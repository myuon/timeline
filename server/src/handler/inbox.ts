import { Context } from "koa";
import { App } from "./app";
import { userIdUrl } from "../config";
import dayjs from "dayjs";
import { ulid } from "ulid";
import { Note } from "../../../shared/model/note";
import { ApActivity } from "../protocols/ap/activity";

export const follow = async (app: App, ctx: Context, activity: ApActivity) => {
  if (!activity.object || !activity.actor) {
    ctx.log.warn(`${JSON.stringify(activity)}`);
    ctx.throw(400, "Bad request");
  }

  const objectActor = await app.actorRepository.findByFederatedId(
    activity.object as string
  );
  if (!objectActor) {
    ctx.throw(404, `Actor not found: ${activity.object}`);
  }

  const actor = await app.actorRepository.findByFederatedId(activity.actor);
  if (!actor) {
    ctx.throw(404, `Actor not found: ${activity.actor}`);
  }

  const followRelation = {
    userId: actor.userId,
    targetUserId: objectActor.userId,
    createdAt: dayjs().unix(),
  };
  await app.followRelationRepository.save(followRelation);

  const document = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Accept",
    actor: userIdUrl,
    object: activity,
  } as ApActivity;

  const { data, error } = await app.deliveryClient.deliveryActivity(
    actor.inboxUrl,
    document
  );
  if (error) {
    ctx.log.error(error);
    ctx.throw(500, "Internal server error");
  }
  ctx.log.info(data);

  ctx.status = 200;
};

export const create = async (
  app: App,
  ctx: Context,
  activity: {
    objectId: string;
    actorId: string;
    objectContent: string;
  }
) => {
  const note = {
    id: ulid(),
    federatedId: activity.objectId,
    userId: activity.actorId,
    content: activity.objectContent,
    createdAt: dayjs().unix(),
  } as Note;

  // NOTE: if the note is already exists, federatedId is not unique and cannot save it.
  await app.noteRepository.save(note);

  ctx.status = 200;

  return note;
};
