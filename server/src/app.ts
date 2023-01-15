import Koa, { Middleware } from "koa";
import mount from "koa-mount";
import logger from "koa-pino-logger";
import { serveStaticProd } from "./middleware/serve";
import { newRouter } from "./router";
import proxy from "koa-proxies";
import path from "path";
import { userActor } from "./config";
import { App } from "./handler/app";

export const newApp = (
  authMiddleware: Middleware | undefined,
  appContext: App
) => {
  const app = new Koa();
  app.use(logger());

  const router = newRouter({
    prefix: "",
  });

  if (authMiddleware) {
    app.use(authMiddleware);
  }
  app.use(
    mount(
      "/web",
      serveStaticProd({
        path: path.resolve(__dirname, "..", "..", "web"),
      })
    )
  );
  app.use(async (ctx, next) => {
    if (ctx.request.path.startsWith("/web")) {
      if (process.env.NODE_ENV !== "production") {
        return proxy("/web", {
          target: "http://localhost:5173",
          changeOrigin: true,
        })(ctx, next);
      }
    } else {
      ctx.state.app = appContext;

      await (ctx.state.app as App).actorRepository.save(userActor);

      return await next();
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
};
