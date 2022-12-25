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
app.use(
  serveStaticProd({
    path: path.resolve(__dirname, "..", "web"),
    excludePrefix: "/api",
    fallbackForSpa: true,
  })
);

const router = newRouter({
  prefix: "/api",
});
app.use(authJwt(auth));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log(`✨ Server running on http://localhost:3000`);
