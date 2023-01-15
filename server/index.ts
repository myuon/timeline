import "reflect-metadata";
import * as path from "path";
import { DataSource } from "typeorm";
import adminKey from "../.secrets/adminKey.json";
import * as admin from "firebase-admin";
import https from "https";
import fs from "fs";
import { newApp } from "./src/app";
import { entities } from "./src/infra/db";

const dataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "db.sqlite"),
  entities,
  logging: true,
  synchronize: true,
});

admin.initializeApp({
  credential: admin.credential.cert(adminKey as admin.ServiceAccount),
});

const auth = admin.auth();
const app = newApp(auth, dataSource);

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
