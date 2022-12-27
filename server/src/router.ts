import Router, { IRouterOptions } from "koa-router";
import fetch from "node-fetch";

const domain = `https://tl.ramda.io`;

export const newRouter = (options?: IRouterOptions) => {
  const router = new Router(options);

  router.get("/.well-known/host-meta", async (ctx) => {
    ctx.body = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="${domain}/.well-known/webfinger?resource={uri}"/>
</XRD>`;
  });
  router.get("/.well-known/webfinger", async (ctx) => {
    const resource = ctx.query.resource;
    if (!resource) {
      ctx.throw(400, "Invalid resource");
      return;
    }

    ctx.body = {
      subject: resource,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `${domain}/users/${resource}`,
        },
      ],
    };
  });
  router.get("/federation/:userName", async (ctx) => {
    const userName = ctx.params.userName;
    const [, domain] = userName.split("@");
    const resp = await fetch(
      `https://${domain}/.well-known/webfinger?resource=acct:${userName}`
    );
    if (!resp.ok) {
      ctx.throw(400, "Invalid user name");
      return;
    }

    const data = (await resp.json()) as {
      subject: string;
      links: {
        rel: string;
        type: string;
        href: string;
      }[];
    };
    const self = data.links.find((link) => link.rel === "self");
    const actorJsonUrl = self ? `${self.href}.json` : null;
    if (!actorJsonUrl) {
      ctx.throw(400, "Invalid user name");
      return;
    }

    const actorResp = await fetch(actorJsonUrl);
    if (!actorResp.ok) {
      ctx.throw(400, "Invalid user name");
      return;
    }

    ctx.body = await actorResp.json();
  });
  router.get("/me", async (ctx) => {
    const auth = ctx.state.auth;

    ctx.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Person",
      id: `${domain}/users/${auth.uid}`,
      following: `${domain}/users/${auth.uid}/following`,
      followers: `${domain}/users/${auth.uid}/followers`,
      inbox: `${domain}/users/${auth.uid}/inbox`,
      outbox: `${domain}/users/${auth.uid}/outbox`,
      preferredUsername: auth.name,
      name: auth.name,
      summary: auth.name,
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: auth.photoURL,
      },
    };
  });
  router.get("/users/myuon", async (ctx) => {
    const userName = "myuon";

    ctx.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Person",
      id: `${domain}/users/${userName}`,
      following: `${domain}/users/${userName}/following`,
      followers: `${domain}/users/${userName}/followers`,
      inbox: `${domain}/users/${userName}/inbox`,
      outbox: `${domain}/users/${userName}/outbox`,
      preferredUsername: userName,
      name: userName,
      summary: userName,
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
      },
    };
  });

  return router;
};
