import Koa from "koa";
import mount from "koa-mount";
import logger from "koa-pino-logger";
import { authJwt } from "./middleware/auth";
import { serveStaticProd } from "./middleware/serve";
import { newRouter } from "./router";
import proxy from "koa-proxies";
import { DataSource } from "typeorm";
import { Auth } from "firebase-admin/lib/auth/auth";
import path from "path";
import { newNoteRepository, NoteTable } from "./infra/noteRepository";
import {
  FollowRelationTable,
  newFollowRelationRepository,
} from "./infra/followRelationRepository";
import { ActorTable, newActorRepository } from "./infra/actorRepository";
import {
  InboxItemTable,
  newInboxItemRepository,
} from "./infra/inboxRepository";
import { newShareRepository, ShareTable } from "./infra/shareRepository";
import { userActor } from "./config";
import { App } from "./handler/app";

export const newApp = (auth: Auth | undefined, dataSource: DataSource) => {
  const app = new Koa();
  app.use(logger());

  const router = newRouter({
    prefix: "",
  });

  if (auth) {
    app.use(authJwt(auth));
  }
  app.use(
    mount(
      "/web",
      serveStaticProd({
        path: path.resolve(__dirname, "..", "web"),
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
      ctx.state.app = {
        noteRepository: newNoteRepository(dataSource.getRepository(NoteTable)),
        followRelationRepository: newFollowRelationRepository(
          dataSource.getRepository(FollowRelationTable)
        ),
        actorRepository: newActorRepository(
          dataSource.getRepository(ActorTable)
        ),
        inboxItemRepository: newInboxItemRepository(
          dataSource.getRepository(InboxItemTable)
        ),
        shareRepository: newShareRepository(
          dataSource.getRepository(ShareTable)
        ),
      } as App;

      await (ctx.state.app as App).actorRepository.save(userActor);

      return await next();
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
};
