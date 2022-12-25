import { Middleware } from "koa";
import serve from "koa-static";
import path from "path";

const fallbackNext =
  (root: string): Middleware =>
  async (ctx, next) => {
    return serve(path.resolve(root, "index.html"))(ctx, next);
  };

export const serveStaticProd =
  (options: {
    path: string;
    excludePrefix?: string;
    fallbackForSpa?: boolean;
  }): Middleware =>
  async (ctx, next) => {
    if (
      (options.excludePrefix
        ? !ctx.request.path.startsWith(options.excludePrefix)
        : false) &&
      process.env.NODE_ENV === "production"
    ) {
      return serve(options.path, {
        defer: true,
      })(ctx, fallbackNext ? fallbackNext(options.path)(ctx, next) : next);
    } else {
      return next();
    }
  };
