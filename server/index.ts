import "reflect-metadata";
import * as path from "path";
import { DataSource } from "typeorm";
import adminKey from "../.secrets/adminKey.json";
import * as admin from "firebase-admin";
import https from "https";
import fs from "fs";
import { newApp } from "./src/app";
import { entities } from "./src/infra/db";
import { authJwt } from "./src/middleware/auth";
import { newNoteRepository, NoteTable } from "./src/infra/noteRepository";
import {
  FollowRelationTable,
  newFollowRelationRepository,
} from "./src/infra/followRelationRepository";
import { ActorTable, newActorRepository } from "./src/infra/actorRepository";
import {
  InboxItemTable,
  newInboxItemRepository,
} from "./src/infra/inboxRepository";
import { newShareRepository, ShareTable } from "./src/infra/shareRepository";
import { newDeliveryClient } from "./src/infra/delivery";
import { signKey } from "./src/handler/ap/delivery";

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
const app = newApp(authJwt(auth), {
  noteRepository: newNoteRepository(dataSource.getRepository(NoteTable)),
  followRelationRepository: newFollowRelationRepository(
    dataSource.getRepository(FollowRelationTable)
  ),
  actorRepository: newActorRepository(dataSource.getRepository(ActorTable)),
  inboxItemRepository: newInboxItemRepository(
    dataSource.getRepository(InboxItemTable)
  ),
  shareRepository: newShareRepository(dataSource.getRepository(ShareTable)),
  deliveryClient: newDeliveryClient(signKey),
});

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
