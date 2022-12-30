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

const router = newRouter({
  prefix: "",
});

app.use(authJwt(auth));
app.use(
  serveStaticProd({
    path: path.resolve(__dirname, ".."),
  })
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
    } as App;

    return await next();
  }
});
app.use(router.routes());
app.use(router.allowedMethods());

const main = async () => {
  await dataSource.initialize();

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`✨ Server running on http://localhost:${port}`);
};

void main();
