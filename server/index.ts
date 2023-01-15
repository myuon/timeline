import "reflect-metadata";
import Koa from "koa";
import logger from "koa-pino-logger";
import * as path from "path";
import { serveStaticProd } from "./src/middleware/serve";
import { newRouter } from "./src/router";
import { DataSource } from "typeorm";
import adminKey from "../.secrets/adminKey.json";
import * as admin from "firebase-admin";
import { authJwt } from "./src/middleware/auth";
import proxy from "koa-proxies";
import { newNoteRepository, NoteTable } from "./src/infra/noteRepository";
import { App } from "./src/handler/app";
import mount from "koa-mount";
import {
  FollowRelationTable,
  newFollowRelationRepository,
} from "./src/infra/followRelationRepository";
import https from "https";
import fs from "fs";
import { ActorTable, newActorRepository } from "./src/infra/actorRepository";
import {
  InboxItemTable,
  newInboxItemRepository,
} from "./src/infra/inboxRepository";
import { userActor } from "./src/config";
import { newShareRepository, ShareTable } from "./src/infra/shareRepository";

const dataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "db.sqlite"),
  entities: [
    NoteTable,
    FollowRelationTable,
    ActorTable,
    InboxItemTable,
    ShareTable,
  ],
  logging: true,
  synchronize: true,
});

admin.initializeApp({
  credential: admin.credential.cert(adminKey as admin.ServiceAccount),
});

const auth = admin.auth();

const app = new Koa();
app.use(logger());

const router = newRouter({
  prefix: "",
});

app.use(authJwt(auth));
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
      actorRepository: newActorRepository(dataSource.getRepository(ActorTable)),
      inboxItemRepository: newInboxItemRepository(
        dataSource.getRepository(InboxItemTable)
      ),
      shareRepository: newShareRepository(dataSource.getRepository(ShareTable)),
    } as App;

    await (ctx.state.app as App).actorRepository.save(userActor);

    return await next();
  }
});
app.use(router.routes());
app.use(router.allowedMethods());

const main = async () => {
  const port = process.env.PORT || 3000;
  const httpsPort = Number(port) + 1;

  await dataSource.initialize();

  app.listen(port);
  console.log(`Starting in ${process.env.NODE_ENV} mode`);
  console.log(`✨ Server running on http://localhost:${port}`);

  if (process.env.NODE_ENV === "development") {
    https
      .createServer(
        {
          key: fs.readFileSync(
            path.join(__dirname, "../.secrets/server_key.pem")
          ),
          cert: fs.readFileSync(
            path.join(__dirname, "../.secrets/server_crt.pem")
          ),
        },
        app.callback()
      )
      .listen(httpsPort);
    console.log(`✨ Server running on http://localhost:${httpsPort}`);
  }
};

void main();
