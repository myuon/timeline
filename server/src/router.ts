import koaBody from "koa-body";
import Router, { IRouterOptions } from "koa-router";
import { z } from "zod";
import { schemaForType } from "./helper/zod";
import fetch from "node-fetch";

export const newRouter = (options?: IRouterOptions) => {
  const router = new Router(options);

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
  router.get("/hello", async (ctx) => {
    ctx.body = "Hello World!";
  });
  router.post("/echo", koaBody(), async (ctx) => {
    interface EchoInput {
      message: string;
    }

    const schema = schemaForType<EchoInput>()(
      z.object({
        message: z.string(),
      })
    );
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error);
      return;
    }

    ctx.body = result.data.message;
  });

  return router;
};
