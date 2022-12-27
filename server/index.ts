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

const dataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "db.sqlite"),
  entities: [],
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

const router = newRouter({
  prefix: "",
});
app.use(authJwt(auth));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log(`✨ Server running on http://localhost:3000`);
