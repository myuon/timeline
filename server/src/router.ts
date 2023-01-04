import Router, { IRouterOptions } from "koa-router";
import fs from "fs";
import path from "path";
import koaBody from "koa-body";
import { createNote } from "./handler/note";
import { App } from "./handler/app";
import dayjs from "dayjs";
import { z } from "zod";
import { schemaForType } from "./helper/zod";
import { Activity } from "@/shared/model/activity";
import { follow } from "./handler/inbox";
import { domain, userId, userName } from "./config";
import { parseBody } from "./middleware/parseBody";
import { serializeApNote } from "./handler/ap/note";
import { serializeCreateNoteActivity } from "./handler/ap/activity";

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
    };
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
        perPage: 5,
      });

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollectionPage",
        id: `${userId}/outbox?page=true`,
        partOf: `${userId}/outbox`,
        orderedItems: notes.map((note) =>
          serializeCreateNoteActivity(userId, note)
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

    const schema = schemaForType<Activity>()(
      z.object({
        type: z.string(),
        published: z.string().optional(),
        actor: z.string().optional(),
        object: z.string().optional(),
        target: z.string().optional(),
      })
    );
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error);
      return;
    }

    const activity = result.data;
    if (activity.type === "Follow") {
      await follow(ctx.state.app, ctx, activity);
    } else {
      ctx.throw(400, "Unsupported activity type");
    }
  });

  router.post("/api/note", koaBody(), async (ctx) => {
    await createNote(ctx.state.app, ctx);
  });

  return router;
};
