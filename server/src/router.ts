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
import { domain, userName } from "./config";
import { Middleware } from "koa";
import CoBody from "co-body";

const parseBody: Middleware = async (ctx, next) => {
  ctx.request.body = await CoBody.json(ctx);

  return next();
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
      aliases: [`https://${domain}/u/${userName}`],
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `https://${domain}/u/${userName}`,
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
      id: `https://${domain}/u/${userName}`,
      following: `https://${domain}/u/${userName}/following`,
      followers: `https://${domain}/u/${userName}/followers`,
      inbox: `https://${domain}/u/${userName}/inbox`,
      outbox: `https://${domain}/u/${userName}/outbox`,
      preferredUsername: userName,
      name: userName,
      summary: `@${userName} on ${domain}`,
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
      },
      url: `https://${domain}/u/${userName}`,
      publicKey: {
        id: `https://${domain}/u/${userName}#main-key`,
        type: "Key",
        owner: `https://${domain}/u/${userName}`,
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
      const notes = await ctx.state.app.noteRepository.findLatest(
        `https://${domain}/u/${userName}`,
        {
          page: 0,
          perPage: 5,
        }
      );

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollectionPage",
        id: `https://${domain}/u/${userName}/outbox?page=true`,
        partOf: `https://${domain}/u/${userName}/outbox`,
        orderedItems: notes.map((note) => ({
          id: `https://${domain}/u/${userName}/s/${note.id}/activity`,
          type: "Create",
          actor: `https://${domain}/u/${userName}`,
          cc: [`https://${domain}/u/${userName}/followers`],
          to: ["https://www.w3.org/ns/activitystreams#Public"],
          object: {
            type: "Note",
            id: `https://${domain}/u/${userName}/s/${note.id}`,
            attributedTo: `https://${domain}/u/${userName}`,
            content: note.content,
            to: ["https://www.w3.org/ns/activitystreams#Public"],
            cc: [],
            url: `https://${domain}/u/${userName}/s/${note.id}`,
          },
          published: dayjs(note.createdAt).format("YYYY-MM-DDTHH:mm:ssZ"),
        })),
      };
    } else {
      const count = await ctx.state.app.noteRepository.findCount(userName);

      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id: `https://${domain}/u/${userName}/outbox`,
        totalItems: count,
        last: `https://${domain}/u/${userName}/outbox?page=true`,
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
      await ctx.state.app.followRelationRepository.findFollowersCount(
        `https://${domain}/u/${userName}`
      );
    const followers =
      await ctx.state.app.followRelationRepository.findFollowers(
        `https://${domain}/u/${userName}`
      );

    ctx.body = {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "OrderedCollection",
      id: `https://${domain}/u/${userName}/followers`,
      totalItems: count,
      orderedItems: followers.map((follower) => ({
        "@context": ["https://www.w3.org/ns/activitystreams"],
        type: "Person",
        url: follower.userUrl,
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
      id: `https://${domain}/u/${userName}/following`,
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
