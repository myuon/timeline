import Router, { IRouterOptions } from "koa-router";
import fs from "fs";
import path from "path";
import koaBody from "koa-body";

const domain = `tl.ramda.io`;
const userName = "myuon";

export const newRouter = (options?: IRouterOptions) => {
  const router = new Router(options);

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
      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollectionPage",
        id: `https://${domain}/u/${userName}/outbox?page=true`,
        partOf: `https://${domain}/u/${userName}/outbox`,
        orderedItems: [
          {
            id: `https://${domain}/u/${userName}/s/1/activity`,
            type: "Create",
            actor: `https://${domain}/u/${userName}`,
            cc: [`https://${domain}/u/${userName}/followers`],
            to: ["https://www.w3.org/ns/activitystreams#Public"],
            object: {
              type: "Note",
              id: `https://${domain}/u/${userName}/s/1`,
              attributedTo: `https://${domain}/u/${userName}`,
              content: "<p>Hello, World!</p>",
              to: ["https://www.w3.org/ns/activitystreams#Public"],
              cc: [],
              url: `https://${domain}/u/${userName}/s/1`,
            },
            published: "2022-12-29T00:00:00.000Z",
          },
        ],
      };
    } else {
      ctx.body = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id: `https://${domain}/u/${userName}/outbox`,
        totalItems: 1,
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

    ctx.body = {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "OrderedCollection",
      id: `https://${domain}/u/${userName}/followers`,
      totalItems: 0,
      orderedItems: [],
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
  router.post("/u/:userName/inbox", koaBody(), async (ctx) => {
    ctx.log.info("request body: " + JSON.stringify(ctx.request.body));
    ctx.body = "ok";
  });

  return router;
};
