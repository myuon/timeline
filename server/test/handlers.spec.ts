import assert from "assert";
import supertest from "supertest";
import { newApp } from "../src/app";
import { DataSource } from "typeorm";
import { entities } from "../src/infra/db";
import {
  domain,
  userFirebaseId,
  userId,
  userIdUrl,
  userName,
} from "../src/config";
import { Middleware } from "koa";
import { NoteTable, newNoteRepository } from "../src/infra/noteRepository";
import {
  FollowRelationTable,
  newFollowRelationRepository,
} from "../src/infra/followRelationRepository";
import { ActorTable, newActorRepository } from "../src/infra/actorRepository";
import {
  InboxItemTable,
  newInboxItemRepository,
} from "../src/infra/inboxRepository";
import { newShareRepository, ShareTable } from "../src/infra/shareRepository";
import { Activity } from "../../shared/model/activity";
import { App } from "../src/handler/app";

const dataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  entities,
  logging: true,
  synchronize: true,
});

const authMiddleware: Middleware = (ctx, next) => {
  if (ctx.request.headers.authorization === "Bearer test_token") {
    ctx.state.auth = {
      uid: userFirebaseId,
      sub: userFirebaseId,
    };
  }

  return next();
};

let delivered: { to: string; activity: Activity }[] = [];

const appContext: App = {
  noteRepository: newNoteRepository(dataSource.getRepository(NoteTable)),
  followRelationRepository: newFollowRelationRepository(
    dataSource.getRepository(FollowRelationTable)
  ),
  actorRepository: newActorRepository(dataSource.getRepository(ActorTable)),
  inboxItemRepository: newInboxItemRepository(
    dataSource.getRepository(InboxItemTable)
  ),
  shareRepository: newShareRepository(dataSource.getRepository(ShareTable)),
  deliveryClient: {
    deliveryActivity: async (to: string, activity: Activity) => {
      delivered.push({ to, activity });

      return { data: undefined };
    },
  },
  signer: {
    verify: async (ctx) => {
      if (ctx.request.headers.signature !== "test_signature") {
        ctx.throw(400, "invalid signature");
      }

      return;
    },
  },
};

const app = newApp(authMiddleware, appContext);
const server = app.listen(Math.floor(Math.random() * 10000));
const request = supertest(server);

describe("api", () => {
  before(async () => {
    await dataSource.initialize();
    await request.get("/manifest.json");
  });

  after(async () => {
    server.close();
    await dataSource.destroy();
  });

  it("/.well-known/nodeinfo", async () => {
    await request
      .get("/.well-known/nodeinfo")
      .timeout(10000)
      .expect(200, {
        links: [
          {
            rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
            href: `https://${domain}/nodeinfo/2.1`,
          },
        ],
      });
  });

  describe("deliver to followers", () => {
    before(async () => {
      await appContext.actorRepository.save({
        userId: "test@example.com",
        name: "test",
        inboxUrl: "https://example.com/inbox",
        summary: "",
        url: "https://example.com",
      });
      await appContext.followRelationRepository.create({
        userId: "test@example.com",
        targetUserId: userId,
        createdAt: 0,
      });
    });

    it("POST /api/note", async () => {
      delivered = [];

      await request
        .post("/api/note")
        .set("Authorization", "Bearer test_token")
        .send({
          content: "Hello, World!",
        })
        .expect(201);

      assert.equal(delivered.length, 1);
      assert.equal(delivered[0].to, "https://example.com/inbox");
      assert.equal(delivered[0].activity.type, "Create");
      assert.match(
        delivered[0].activity.id as string,
        new RegExp(`^${userIdUrl}/s/(.*)/activity$`)
      );
      assert.equal(
        (
          delivered[0].activity.object as {
            content?: string | undefined;
          }
        ).content,
        "<p>Hello, World!</p>"
      );
    });

    it("POST follow /inbox", async () => {
      delivered = [];

      await request
        .post(`/u/${userName}/inbox`)
        .set("signature", "test_signature")
        .send({
          "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
            {
              manuallyApprovesFollowers: "as:manuallyApprovesFollowers",
              sensitive: "as:sensitive",
              Hashtag: "as:Hashtag",
              quoteUrl: "as:quoteUrl",
              toot: "http://joinmastodon.org/ns#",
              Emoji: "toot:Emoji",
              featured: "toot:featured",
              discoverable: "toot:discoverable",
              schema: "http://schema.org#",
              PropertyValue: "schema:PropertyValue",
              value: "schema:value",
              misskey: "https://misskey-hub.net/ns#",
              _misskey_content: "misskey:_misskey_content",
              _misskey_quote: "misskey:_misskey_quote",
              _misskey_reaction: "misskey:_misskey_reaction",
              _misskey_votes: "misskey:_misskey_votes",
              _misskey_talk: "misskey:_misskey_talk",
              isCat: "misskey:isCat",
              vcard: "http://www.w3.org/2006/vcard/ns#",
            },
          ],
          id: "https://misskey.io/follows/99bga7dd11/99bghq5obn",
          type: "Follow",
          actor: "https://misskey.io/users/99bga7dd11",
          object: userIdUrl,
        })
        .expect(200);

      assert.equal(delivered.length, 1);
      assert.equal(delivered[0].to, "https://misskey.io/users/99bga7dd11");
      assert.equal(delivered[0].activity.type, "Accept");
      assert.equal(delivered[0].activity.actor, userIdUrl);
    });
  });
});
