import Router, { IRouterOptions } from "koa-router";
import fs from "fs";
import path from "path";
import koaBody from "koa-body";
import { createNote } from "./handler/note";
import { App } from "./handler/app";
import { z } from "zod";
import { schemaForType } from "./helper/zod";
import { create, follow } from "./handler/inbox";
import { domain, userActor, userId, userName } from "./config";
import { parseBody } from "./middleware/parseBody";
import {
  serializeCreateNoteActivity,
  serializeDeleteNoteActivity,
  serializeFollowActivity,
} from "./handler/ap/activity";
import { deliveryActivity } from "./handler/ap/delivery";
import { Context } from "koa";
import { getActor } from "./handler/ap/api";
import { ulid } from "ulid";
import dayjs from "dayjs";
import { importVerifyKey, verifyHttpHeaders } from "./helper/signature";
import { Person } from "../../shared/model/person";
import { Activity } from "../../shared/model/activity";
import { presentActor } from "../../shared/model/actor";
import { TimelineObject } from "../../shared/model/timeline";
import { ApiFollowRequest } from "../../shared/request/follow";

const requireAuth = (ctx: Context) => {
  if (!ctx.state.auth) {
    ctx.throw(401, "Unauthorized");
  }
};

export const newRouter = (options?: IRouterOptions) => {
  const router = new Router<{ app: App }>(options);

  router.get("/.well-known/host-meta", async (ctx) => {
    ctx.set("Content-Type", "application/xrd+xml");
    ctx.body = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https://${domain}/.well-known/webfinger?resource={uri}"/>
</XRD>`;
  });
  router.get("/.well-known/webfinger", async (ctx) => {
    if (ctx.query.resource !== `acct:${userName}@${domain}`) {
      ctx.throw(404, "Not found");
      return;
    }

    ctx.body = {
      subject: `acct:${userName}@${domain}`,
      aliases: [userId],
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: userId,
        },
      ],
    };
    ctx.set("Content-Type", "application/jrd+json");
  });
  router.get("/.well-known/nodeinfo", async (ctx) => {
    ctx.body = {
      links: [
        {
          rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
          href: `https://${domain}/nodeinfo/2.1`,
        },
      ],
    };
    ctx.set("Content-Type", "application/json");
  });
  router.get("/nodeinfo/2.1", async (ctx) => {
    ctx.body = {
      version: "2.1",
      software: {
        name: "timeline",
        version: "0.1.0",
      },
      protocols: ["activitypub"],
      openRegistrations: false,
      usage: {
        users: {
          total: 1,
        },
      },
    };
    ctx.set("Content-Type", "application/json");
  });

  router.get("/u/:userName", async (ctx) => {
    if (ctx.params.userName !== userName) {
      ctx.throw(404, "Not found");
      return;
    }
    if (!ctx.accepts("application/activity+json")) {
      ctx.body = userName;
      return;
    }

    ctx.body = {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1",
      ],
      type: "Person",
      id: userId,
      following: `${userId}/following`,
      followers: `${userId}/followers`,
      inbox: `${userId}/inbox`,
      outbox: `${userId}/outbox`,
      preferredUsername: userName,
      name: userName,
      summary: `@${userName} on ${domain}`,
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
      },
      url: userId,
      publicKey: {
        id: `${userId}#main-key`,
        type: "Key",
        owner: userId,
        publicKeyPem: fs.readFileSync(
          path.join(__dirname, "../../.secrets/public.pem"),
          "utf-8"
        ),
      },
    } as Person;
    ctx.set("Content-Type", "application/activity+json");
  });
  router.get("/u/:userName/outbox", async (ctx) => {
    if (ctx.params.userName !== userName) {
      ctx.throw(404, "Not found");
      return;
    }
    if (!ctx.accepts("application/activity+json")) {
      ctx.body = userName;
      return;
    }

    const page = ctx.query.page === "true";
    if (page) {
      const notes = await ctx.state.app.noteRepository.findLatest(userId, {
        page: 0,
        size: 5,
      });

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollectionPage",
        id: `${userId}/outbox?page=true`,
        partOf: `${userId}/outbox`,
        orderedItems: notes.map((note) =>
          serializeCreateNoteActivity(
            userId,
            "https://www.w3.org/ns/activitystreams#Public",
            note
          )
        ),
      };
    } else {
      const count = await ctx.state.app.noteRepository.findCount(userName);

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id: `${userId}/outbox`,
        totalItems: count,
        last: `${userId}/outbox?page=true`,
      };
    }
    ctx.set("Content-Type", "application/activity+json");
  });
  router.get("/u/:userName/followers", async (ctx) => {
    if (ctx.params.userName !== userName) {
      ctx.throw(404, "Not found");
      return;
    }
    if (!ctx.accepts("application/activity+json")) {
      ctx.body = userName;
      return;
    }

    const count =
      await ctx.state.app.followRelationRepository.findFollowersCount(userId);
    const followers =
      await ctx.state.app.followRelationRepository.findFollowers(userId);

    ctx.body = {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "OrderedCollection",
      id: `${userId}/followers`,
      totalItems: count,
      orderedItems: followers.map((follower) => ({
        "@context": ["https://www.w3.org/ns/activitystreams"],
        type: "Person",
        url: follower.userId,
      })),
    };
    ctx.set("Content-Type", "application/activity+json");
  });
  router.get("/u/:userName/following", async (ctx) => {
    if (ctx.params.userName !== userName) {
      ctx.throw(404, "Not found");
      return;
    }
    if (!ctx.accepts("application/activity+json")) {
      ctx.body = userName;
      return;
    }

    ctx.body = {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "OrderedCollection",
      id: `${userId}/following`,
      totalItems: 0,
      orderedItems: [],
    };
    ctx.set("Content-Type", "application/activity+json");
  });
  router.get("/u/:userName/s/:id", async (ctx) => {
    ctx.body = ctx.params.id;
  });
  router.post("/u/:userName/inbox", parseBody, async (ctx) => {
    ctx.log.info("inbox request: " + JSON.stringify(ctx.request.body));

    // verify
    const signatureHeader = ctx.request.headers.signature as string | undefined;
    if (!signatureHeader) {
      ctx.throw(400, "Missing signature header");
      return;
    }
    const signaturePairs = signatureHeader.split(",").map((s) => {
      const pair = s.trim().split("=");
      return [pair[0], pair[1].replace(/"/g, "")];
    });

    const keyId = signaturePairs.find((p) => p[0] === "keyId")?.[1];
    if (!keyId) {
      ctx.throw(400, "Missing keyId");
      return;
    }
    const { data, error: actorError } = await getActor(keyId);
    const publicKeyPem = data?.publicKey?.publicKeyPem;
    if (actorError || !publicKeyPem) {
      ctx.log.info(`(getKeyId) data: ${data}, error: ${actorError}`);
      ctx.throw(400, "Invalid keyId");
      return;
    }

    const headers = signaturePairs.find((p) => p[0] === "headers")?.[1];
    const signature = signaturePairs.find((p) => p[0] === "signature")?.[1];
    const algorithm = signaturePairs.find((p) => p[0] === "algorithm")?.[1];

    const key = await importVerifyKey(publicKeyPem);

    const date = ctx.request.headers.date as string | undefined;
    if (!date) {
      ctx.throw(400, "Missing date header");
      return;
    }
    if (Math.abs(Date.now() - new Date(date).getTime()) > 1000 * 60 * 5) {
      ctx.log.info(`(date) date: ${date}`);
      ctx.throw(400, "Invalid date");
      return;
    }

    const { error } = await verifyHttpHeaders(
      key,
      algorithm ?? "",
      headers ?? "",
      signature ?? "",
      {
        body: ctx.request.body,
        path: ctx.request.path,
        method: ctx.request.method,
        headers: ctx.request.headers as Record<string, string | undefined>,
      }
    );
    if (error) {
      ctx.throw(400, `Verification failed: ${error}`);
      return;
    }

    const schema = schemaForType<Activity>()(
      z.object({
        type: z.string(),
        published: z.string().optional(),
        actor: z.string().optional(),
        object: z
          .string()
          .or(
            z.object({
              id: z.string(),
              type: z.string(),
              content: z.string().optional(),
            })
          )
          .optional(),
        target: z.string().optional(),
        cc: z.array(z.string()).optional(),
      })
    );
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error);
      return;
    }

    const activity = result.data;

    if (!activity.actor) {
      ctx.throw(400, "Missing actor");
      return;
    }

    const actor = await ctx.state.app.actorRepository.findByFederatedId(
      activity.actor
    );
    if (!actor) {
      const { data, error } = await getActor(activity.actor);
      if (!data || error) {
        ctx.log.warn(error);
        ctx.throw(400, "Failed to get actor");
        return;
      }

      await ctx.state.app.actorRepository.save({
        id: ulid(),
        federatedId: data?.id,
        rawData: JSON.stringify(data),
        inboxUrl: data?.inbox,
        name: data?.name,
        summary: data?.summary,
        url: data?.url,
        publicKeyPem: data?.publicKey?.publicKeyPem,
        iconUrl: data?.icon?.url,
      });
    }

    if (activity.type === "Follow") {
      await follow(ctx.state.app, ctx, activity);
    } else if (activity.type === "Create") {
      const created = await create(ctx.state.app, ctx, activity);

      // deliver to LOCAL followers
      await Promise.all(
        activity.cc?.map(async (cc) => {
          if (cc.endsWith("/followers")) {
            const userId = cc.replace("/followers", "");
            const followers =
              await ctx.state.app.followRelationRepository.findFollowers(
                userId
              );
            await Promise.all(
              followers.map(async (relation) => {
                if (!relation.userId.startsWith(`https://${domain}`)) {
                  return;
                }

                // = create an inbox item
                await ctx.state.app.inboxItemRepository.create({
                  id: ulid(),
                  userId: relation.userId,
                  type: "Note",
                  itemId: created.id,
                  createdAt: dayjs().unix(),
                });
              })
            );
          }
        }) ?? []
      );
    } else if (activity.type === "Delete") {
      ctx.status = 204;
    } else {
      ctx.throw(400, "Unsupported activity type");
    }
  });

  router.post("/api/note", koaBody(), async (ctx) => {
    requireAuth(ctx);

    const note = await createNote(ctx.state.app, ctx);

    // = create an inbox item
    await ctx.state.app.inboxItemRepository.create({
      id: ulid(),
      userId: userId,
      type: "Note",
      itemId: note.id,
      createdAt: dayjs().unix(),
    });

    // FIXME: delivery SHOULD be performed asynchronously
    ctx.log.info("delivery");

    const activity = serializeCreateNoteActivity(
      userId,
      "https://www.w3.org/ns/activitystreams#Public",
      note
    );
    const followers =
      await ctx.state.app.followRelationRepository.findFollowers(userId);

    await Promise.allSettled(
      followers.map(async (follower) => {
        const { data, error } = await deliveryActivity(
          follower.userId,
          activity
        );
        if (error) {
          ctx.log.error(error);
          return;
        }
        ctx.log.info(`deliveryActivity: ${data}`);
      })
    );

    ctx.log.info("delivery end");
  });
  router.delete("/api/note/:id", async (ctx) => {
    requireAuth(ctx);

    const note = await ctx.state.app.noteRepository.findById(ctx.params.id);
    if (!note) {
      ctx.throw(404, "Not found");
      return;
    }

    if (note.userId !== userId) {
      ctx.throw(403, "Forbidden");
      return;
    }

    await ctx.state.app.noteRepository.delete(ctx.params.id);

    ctx.status = 204;

    // FIXME: delivery SHOULD be performed asynchronously
    ctx.log.info("delivery");

    const activity = serializeDeleteNoteActivity(
      userId,
      ctx.params.id,
      `${userId}/s/${ctx.params.id}`
    );
    const followers =
      await ctx.state.app.followRelationRepository.findFollowers(userId);

    await Promise.allSettled(
      followers.map(async (follower) => {
        const { data, error } = await deliveryActivity(
          follower.userId,
          activity
        );
        if (error) {
          ctx.log.error(error);
          return;
        }
        ctx.log.info(`deliveryActivity: ${data}`);
      })
    );

    ctx.log.info("delivery end");

    // remove from inboxes
    const items = await ctx.state.app.inboxItemRepository.findByItemId(
      "Note",
      note.id
    );
    await Promise.all(
      items.map(async (item) => {
        await ctx.state.app.inboxItemRepository.delete(item.id);
      })
    );
  });
  router.get("/api/timeline/note", async (ctx) => {
    requireAuth(ctx);

    const items = await ctx.state.app.inboxItemRepository.findTimelineItems(
      userId,
      {
        page: Number(ctx.query.page),
        size: Number(ctx.query.size),
        since: Number(ctx.query.since),
        type: ctx.query.type as string,
      }
    );
    const notes = await ctx.state.app.noteRepository.findByIds(
      items.map((item) => item.itemId)
    );
    const actors = await ctx.state.app.actorRepository.findByFederatedIds(
      notes.map((note) => note.userId)
    );

    ctx.body = items.map((item) => {
      const note = notes.find((note) => note.id === item.itemId);
      const actor = actors.find((actor) => actor.federatedId === note?.userId);

      return {
        ...item,
        note,
        actor: actor ? presentActor(actor, domain) : undefined,
      };
    }) as TimelineObject[];
  });
  router.post("/api/follow", koaBody(), async (ctx) => {
    requireAuth(ctx);

    const schema = schemaForType<ApiFollowRequest>()(
      z.object({
        id: z.string(),
      })
    );
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error);
      return;
    }

    const { id } = result.data;
    const { error: actorError } = await getActor(id);
    if (actorError) {
      ctx.log.error(actorError);
      ctx.throw(400, "Failed to get actor");
    }

    const activity = serializeFollowActivity(userId, ulid(), id);
    const { data, error } = await deliveryActivity(id, activity);
    if (error) {
      ctx.log.error(error);
      ctx.throw(400, "Failed to delivery activity");
    }

    ctx.log.info(`followResponse: ${data}`);

    await ctx.state.app.followRelationRepository.save({
      userId: userId,
      targetUserId: id,
      createdAt: dayjs().unix(),
    });

    ctx.status = 204;
  });
  router.get("/api/me", async (ctx) => {
    requireAuth(ctx);

    ctx.body = userActor;
  });
  router.get("/api/user/:userId", async (ctx) => {
    const userId = `https://${domain}/u/${ctx.params.userId}`;

    const actor = await ctx.state.app.actorRepository.findById(userId);
    if (!actor) {
      ctx.throw(404, "Not found");
      return;
    }

    ctx.body = presentActor(actor, domain);
  });
  router.get("/api/user/:userId/notes", async (ctx) => {
    const userId = `https://${domain}/u/${ctx.params.userId}`;

    const notes = await ctx.state.app.noteRepository.findLatest(userId, {
      page: Number(ctx.query.page),
      size: Number(ctx.query.size),
    });

    ctx.body = notes;
  });

  return router;
};
