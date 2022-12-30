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

const dataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "db.sqlite"),
  entities: [NoteTable],
  logging: true,
  synchronize: true,
});

admin.initializeApp({
  credential: admin.credential.cert(adminKey as admin.ServiceAccount),
});

const auth = admin.auth();
const app = new Koa();

app.use(logger());
if (process.env.NODE_ENV !== "production") {
  app.use(
    proxy("/web", {
      target: "http://localhost:5173",
      changeOrigin: true,
    })
  );
}
app.use(async (ctx, next) => {
  if (ctx.request.path.startsWith("/web")) {
    serveStaticProd({
      path: path.resolve(__dirname, ".."),
    })(ctx, next);
  } else {
    await next();
  }
});
app.use(async (ctx, next) => {
  ctx.state.app = {
    noteRepository: newNoteRepository(dataSource.getRepository(NoteTable)),
  } as App;

  await next();
});

const router = newRouter({
  prefix: "",
});
app.use(authJwt(auth));
app.use(router.routes());
app.use(router.allowedMethods());

const main = async () => {
  await dataSource.initialize();

  app.listen(3000);
  console.log(`✨ Server running on http://localhost:3000`);
};

void main();
