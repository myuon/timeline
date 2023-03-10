import Router, { IRouterOptions } from "koa-router";
import fs from "fs";
import path from "path";
import koaBody from "koa-body";
import { createNote } from "./handler/note";
import { App } from "./handler/app";
import { z } from "zod";
import { schemaForType } from "./helper/zod";
import { create, follow } from "./handler/inbox";
import {
  domain,
  userActor,
  userFirebaseId,
  userId,
  userIdUrl,
  userName,
} from "./config";
import { parseBody } from "./middleware/parseBody";
import {
  serializeAnnounceActivity,
  serializeCreateNoteActivity,
  serializeDeleteNoteActivity,
  serializeFollowActivity,
} from "./handler/ap/activity";
import { Context } from "koa";
import { ulid } from "ulid";
import dayjs from "dayjs";
import { Person } from "../../shared/model/person";
import { newApCreate, schemaForActivity } from "./protocols/ap/activity";
import { TimelineObject } from "../../shared/model/timeline";
import { ApiFollowRequest } from "../../shared/request/follow";
import { syncActor } from "./handler/actor";
import send from "koa-send";
import { deliveryActivityToFollowers } from "./handler/delivery";
import { RssFeedPlugin } from "./plugin/rssfeed/plugin";
import { newApNote, schemaForObject } from "./protocols/ap/object";

const requireAuth = (ctx: Context) => {
  if (!ctx.state.auth) {
    ctx.throw(401, "Unauthorized");
  }
};

export const newRouter = (options?: IRouterOptions) => {
  const router = new Router<{ app: App; auth?: any }>(options);

  router.get("/manifest.webmanifest", async (ctx) => {
    await send(ctx, "manifest.webmanifest", {
      root: path.resolve(__dirname, "..", "..", "web"),
    });
  });
  router.get("/manifest.json", async (ctx) => {
    await send(ctx, "manifest.webmanifest", {
      root: path.resolve(__dirname, "..", "..", "web"),
    });
  });
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
      aliases: [userIdUrl],
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: userIdUrl,
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

    let publicKeyPem = "";
    try {
      publicKeyPem = fs.readFileSync(
        path.join(__dirname, "../../.secrets/public.pem"),
        "utf-8"
      );
    } catch (err) {
      console.error(err);
    }

    ctx.body = {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1",
      ],
      type: "Person",
      id: userIdUrl,
      following: `${userIdUrl}/following`,
      followers: `${userIdUrl}/followers`,
      inbox: `${userIdUrl}/inbox`,
      outbox: `${userIdUrl}/outbox`,
      preferredUsername: userName,
      name: userName,
      summary: `@${userName} on ${domain}`,
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
      },
      url: userIdUrl,
      publicKey: {
        id: `${userIdUrl}#main-key`,
        type: "Key",
        owner: userIdUrl,
        publicKeyPem,
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
      const notes = await ctx.state.app.noteRepository.findLatest(
        `${userId}@${domain}`,
        {
          page: 0,
          size: 5,
        }
      );

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollectionPage",
        id: `${userIdUrl}/outbox?page=true`,
        partOf: `${userIdUrl}/outbox`,
        orderedItems: notes.map((note) =>
          newApCreate({
            activityId: `${userIdUrl}/s/${note.id}`,
            actor: userIdUrl,
            to: ["https://www.w3.org/ns/activitystreams#Public"],
            object: newApNote({
              id: `${userIdUrl}/s/${note.id}`,
              attributedTo: userIdUrl,
              content: note.content,
              to: ["https://www.w3.org/ns/activitystreams#Public"],
              url: `${userIdUrl}/s/${note.id}`,
            }),
            published: dayjs.unix(note.createdAt).toDate().toUTCString(),
          })
        ),
      };
    } else {
      const count = await ctx.state.app.noteRepository.findCount(userName);

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id: `${userIdUrl}/outbox`,
        totalItems: count,
        last: `${userIdUrl}/outbox?page=true`,
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
      id: `${userIdUrl}/followers`,
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
      id: `${userIdUrl}/following`,
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

    const verified = await ctx.state.app.signer.verify(ctx);
    if (verified === "actor_gone") {
      ctx.status = 204;
      ctx.body = "Actor is gone";
      return;
    }

    const result = schemaForActivity.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error);
      return;
    }

    const activity = result.data;

    if (!activity.actor) {
      ctx.throw(400, "Missing actor");
      return;
    }

    let actor = await ctx.state.app.actorRepository.findByFederatedId(
      activity.actor
    );
    if (!actor) {
      await syncActor(ctx, activity.actor);

      actor = await ctx.state.app.actorRepository.findByFederatedId(
        activity.actor
      );
    }

    if (!actor) {
      ctx.throw(404, "Actor not found");
      return;
    }

    if (activity.type === "Follow") {
      await follow(ctx.state.app, ctx, activity);
    } else if (activity.type === "Create") {
      const object = activity.object as
        | {
            id: string;
            type: string;
            content?: string;
          }
        | undefined;
      if (!object) {
        ctx.throw(400, "Missing object");
        return;
      }

      const created = await create(ctx.state.app, ctx, {
        objectId: object.id,
        actorId: actor.userId,
        objectContent: object.content ?? "",
      });

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
    } else if (activity.type === "Announce") {
      const object = activity.object as string;
      const { data, error } = await ctx.state.app.fetchClient.fetcher(object, {
        headers: {
          Accept: "application/activity+json",
        },
      });
      if (error) {
        ctx.throw(400, error);
        return;
      }
      if (!data) {
        ctx.throw(400, "No data");
        return;
      }

      const noteResult = schemaForObject.safeParse(JSON.parse(data));
      if (!noteResult.success) {
        ctx.throw(400, noteResult.error);
        return;
      }

      const created = await create(ctx.state.app, ctx, {
        objectId: noteResult.data.id,
        actorId: actor.userId,
        objectContent: noteResult.data.content ?? "",
      });

      const shareId = ulid();
      await ctx.state.app.shareRepository.create({
        id: shareId,
        userId: actor.userId,
        noteId: created.id,
        createdAt: dayjs().unix(),
      });

      // deliver to LOCAL followers
      await Promise.all(
        activity.cc?.map(async (cc) => {
          if (cc.endsWith("/followers")) {
            const federatedId = cc.replace("/followers", "");
            const federatedIdActor =
              await ctx.state.app.actorRepository.findByFederatedId(
                federatedId
              );
            if (!federatedIdActor) {
              return;
            }

            const followers =
              await ctx.state.app.followRelationRepository.findFollowers(
                federatedIdActor.userId
              );
            await Promise.all(
              followers.map(async (relation) => {
                // = create an inbox item
                await ctx.state.app.inboxItemRepository.create({
                  id: ulid(),
                  userId: relation.userId,
                  type: "Share",
                  itemId: shareId,
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
      userId,
      type: "Note",
      itemId: note.id,
      createdAt: dayjs().unix(),
    });

    // FIXME: delivery SHOULD be performed asynchronously
    ctx.log.info("delivery");

    const activity = serializeCreateNoteActivity(
      userIdUrl,
      "https://www.w3.org/ns/activitystreams#Public",
      note
    );
    await deliveryActivityToFollowers(ctx, activity, userId);
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

    const activity = serializeDeleteNoteActivity(
      userIdUrl,
      ctx.params.id,
      `${userIdUrl}/s/${ctx.params.id}`
    );

    await deliveryActivityToFollowers(ctx, activity, userId);

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
  router.post("/api/note/:id/announce", async (ctx) => {
    requireAuth(ctx);

    if (ctx.state.auth.sub !== userFirebaseId) {
      ctx.throw(403, "Forbidden");
      return;
    }

    const note = await ctx.state.app.noteRepository.findById(ctx.params.id);
    if (!note) {
      ctx.throw(404, "Not found");
      return;
    }

    const shareId = ulid();

    await ctx.state.app.shareRepository.create({
      id: shareId,
      noteId: note.id,
      userId,
      createdAt: dayjs().unix(),
    });

    await ctx.state.app.inboxItemRepository.create({
      id: ulid(),
      userId: userId,
      type: "Share",
      itemId: shareId,
      createdAt: dayjs().unix(),
    });

    // FIXME: delivery SHOULD be performed asynchronously
    ctx.log.info("delivery");

    const activity = serializeAnnounceActivity(
      userIdUrl,
      shareId,
      `${userIdUrl}/s/${note.id}`
    );
    const followers =
      await ctx.state.app.followRelationRepository.findFollowers(userId);

    await Promise.allSettled(
      followers.map(async (follower) => {
        const actor = await ctx.state.app.actorRepository.findByUserId(
          follower.userId
        );
        if (!actor) {
          return;
        }

        const { data, error } =
          await ctx.state.app.deliveryClient.deliveryActivity(
            actor.inboxUrl,
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

    ctx.status = 204;
  });

  router.get("/api/timeline/note", async (ctx) => {
    requireAuth(ctx);

    const items = await ctx.state.app.inboxItemRepository.findTimelineItems(
      userId,
      {
        page: Number(ctx.query.page),
        size: Number(ctx.query.size),
        since: Number(ctx.query.since),
        types: (ctx.query.type as string).split(","),
      }
    );
    const shares = await ctx.state.app.shareRepository.findByIds(
      items.filter((item) => item.type === "Share").map((item) => item.itemId)
    );
    const notes = await ctx.state.app.noteRepository.findByIds([
      ...items
        .filter((item) => item.type === "Note")
        .map((item) => item.itemId),
      ...shares.map((share) => share.noteId),
    ]);
    const actors = await ctx.state.app.actorRepository.findByUserIds(
      notes.map((note) => note.userId)
    );

    ctx.body = items.map((item) => {
      if (item.type === "Note") {
        const note = notes.find((note) => note.id === item.itemId);
        const actor = actors.find((actor) => actor.userId === note?.userId);

        return {
          ...item,
          note,
          actor,
        };
      } else if (item.type === "Share") {
        const share = shares.find((share) => share.id === item.itemId);
        const note = notes.find((note) => note.id === share?.noteId);
        const actor = actors.find((actor) => actor.userId === share?.userId);

        return {
          ...item,
          share,
          note,
          actor,
        };
      }
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
    const actor = await ctx.state.app.actorRepository.findByUserId(id);
    if (!actor || !actor.federatedId) {
      ctx.throw(400, "Failed to get actor");
      return;
    }

    const activity = serializeFollowActivity(
      userIdUrl,
      ulid(),
      actor.federatedId
    );
    const { data, error } = await ctx.state.app.deliveryClient.deliveryActivity(
      actor.inboxUrl,
      activity
    );
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
    const userId = ctx.params.userId;

    const actor = await ctx.state.app.actorRepository.findByUserId(
      userId.includes("@") ? userId : `${userId}@${domain}`
    );
    if (!actor) {
      ctx.throw(404, "Not found");
      return;
    }

    ctx.body = actor;
  });
  router.get("/api/user/:userId/notes", async (ctx) => {
    const userId = ctx.params.userId;

    const notes = await ctx.state.app.noteRepository.findLatest(
      userId.includes("@") ? userId : `${userId}@${domain}`,
      {
        page: Number(ctx.query.page),
        size: Number(ctx.query.size),
      }
    );

    ctx.body = notes;
  });
  router.post("/api/user/:userId/sync", async (ctx) => {
    requireAuth(ctx);

    const userId = ctx.params.userId.includes("@")
      ? ctx.params.userId
      : `${ctx.params.userId}@${domain}`;
    const userDomain = userId.split("@")[1];

    const webfingerUrl = `https://${userDomain}/.well-known/webfinger?resource=acct:${userId}`;
    const { data, error } = await ctx.state.app.fetchClient.fetcher(
      webfingerUrl
    );
    if (!data) {
      console.log(`url: ${webfingerUrl}, error: ${JSON.stringify(error)}`);
      ctx.throw(400, "Failed to fetch webfinger");
      return;
    }
    const resourceData = JSON.parse(data);
    const href = resourceData.links.find(
      (link: any) => link.rel === "self"
    )?.href;

    await syncActor(ctx, href);

    ctx.status = 204;
  });

  router.post("/api/migrate", async (ctx) => {
    requireAuth(ctx);

    const actors = await ctx.state.app.actorRepository.findAll();

    const toAccountId = (federatedId: string) => {
      if (!federatedId.startsWith("https://")) {
        return federatedId;
      }

      const url = new URL(federatedId);
      const domain = url.hostname;
      const name = url.pathname.split("/").pop();

      return `${name}@${domain}`;
    };

    await Promise.all(
      actors.map(async (actor) => {
        await ctx.state.app.actorRepository.save({
          ...actor,
          userId: toAccountId(actor.userId),
        });
      })
    );

    const notes = await ctx.state.app.noteRepository.findAll();

    await Promise.all(
      notes.map(async (note) => {
        await ctx.state.app.noteRepository.save({
          ...note,
          userId: toAccountId(note.userId),
        });
      })
    );

    const followRelations =
      await ctx.state.app.followRelationRepository.findAll();

    await Promise.all(
      followRelations.map(async (followRelation) => {
        // delete first
        await ctx.state.app.followRelationRepository.delete(followRelation);

        await ctx.state.app.followRelationRepository.create({
          ...followRelation,
          userId: toAccountId(followRelation.userId),
          targetUserId: toAccountId(followRelation.targetUserId),
        });
      })
    );

    const inboxItems = await ctx.state.app.inboxItemRepository.findAll();

    await Promise.all(
      inboxItems.map(async (inboxItem) => {
        await ctx.state.app.inboxItemRepository.save({
          ...inboxItem,
          userId: toAccountId(inboxItem.userId),
        });
      })
    );

    ctx.status = 204;
  });

  router.post("/schedule", async (ctx) => {
    const schedules = await ctx.state.app.jobScheduleRepository.findAll();

    await Promise.all(
      schedules.map(async (schedule) => {
        if (dayjs.unix(schedule.lastExecutedAt).add(30, "m") < dayjs()) {
          if (schedule.type === "plugin") {
            const plugin = Object.entries(ctx.state.app.plugins).find(
              ([name]) => name === schedule.name
            );
            if (!plugin) {
              return;
            }

            ctx.log.info(`Running scheduled job: ${plugin[0]}...`);

            await plugin[1].onScheduledRun(ctx.state.app);

            schedule.lastExecutedAt = dayjs().unix();

            await ctx.state.app.jobScheduleRepository.save(schedule);
          }
        }
      })
    );

    ctx.status = 204;
  });

  router.post("/api/schedule", koaBody(), async (ctx) => {
    requireAuth(ctx);

    const schema = schemaForType<{
      name: string;
    }>()(
      z.object({
        name: z.string(),
      })
    );

    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.log.error(result.error);
      ctx.throw(400, "Invalid request");
      return;
    }

    await ctx.state.app.jobScheduleRepository.create({
      id: ulid(),
      name: result.data.name,
      lastExecutedAt: 0,
      forceRunFlag: false,
      type: "plugin",
    });

    ctx.status = 201;
  });

  router.post("/api/plugin/rssfeed/config", koaBody(), async (ctx) => {
    requireAuth(ctx);

    const schema = schemaForType<{
      title: string;
      url: string;
    }>()(
      z.object({
        title: z.string(),
        url: z.string(),
      })
    );

    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.log.error(result.error);
      ctx.throw(400, "Invalid request");
      return;
    }

    const rssfeedPlugin = ctx.state.app.plugins
      .rssfeed as unknown as RssFeedPlugin;

    await rssfeedPlugin.onCreateRssConfig({
      id: ulid(),
      title: result.data.title,
      url: result.data.url,
      createdAt: dayjs().unix(),
    });

    ctx.status = 201;
  });
  router.get("/api/plugin/rssfeed/config", async (ctx) => {
    requireAuth(ctx);

    const rssfeedPlugin = ctx.state.app.plugins
      .rssfeed as unknown as RssFeedPlugin;

    const configs = await rssfeedPlugin.onFindAllRssConfig();

    ctx.body = configs;
  });

  return router;
};
