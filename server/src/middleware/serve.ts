import { Middleware } from "koa";
import serve from "koa-static";

export const serveStaticProd =
  (options: { path: string; excludePrefix?: string }): Middleware =>
  async (ctx, next) => {
    if (
      (options.excludePrefix
        ? !ctx.request.path.startsWith(options.excludePrefix)
        : true) &&
      process.env.NODE_ENV === "production"
    ) {
      return serve(options.path)(ctx, next);
    } else {
      return next();
    }
  };
