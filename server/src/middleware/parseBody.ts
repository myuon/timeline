import CoBody from "co-body";
import { Middleware } from "koa";

export const parseBody: Middleware = async (ctx, next) => {
  ctx.request.body = await CoBody.json(ctx);

  return next();
};
