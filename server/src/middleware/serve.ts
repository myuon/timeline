import { Middleware, Next } from "koa";
import send from "koa-send";
import serve from "koa-static";
import path from "path";

const fallbackNext =
  (servePath: string): Middleware =>
  (ctx): Next =>
  () => {
    return send(ctx, path.join(servePath, "index.html"), { root: "/" });
  };

export const serveStaticProd =
  (options: { path: string; excludePrefix?: string }): Middleware =>
  async (ctx, next) => {
    if (
      (options.excludePrefix
        ? !ctx.request.path.startsWith(options.excludePrefix)
        : true) &&
      process.env.NODE_ENV === "production"
    ) {
      return serve(options.path)(ctx, fallbackNext(options.path)(ctx, next));
    } else {
      return next();
    }
  };
