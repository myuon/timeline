import { Auth } from "firebase-admin/lib/auth/auth";
import { Middleware } from "koa";

export const authJwt =
  (auth: Auth): Middleware =>
  async (ctx, next) => {
    const token = ctx.request.header.authorization?.split("Bearer ")?.[1];

    if (token) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        ctx.state.auth = decodedToken;
      } catch (error) {
        console.error(error);
        ctx.throw("Unauthorized", 401);
      }
    }

    await next();
  };
