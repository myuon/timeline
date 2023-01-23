import assert from "assert";
import supertest from "supertest";
import { initializeApp, newApp } from "../src/app";
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
import {
  JobScheduleTable,
  newJobScheduleRepository,
} from "../src/infra/jobScheduleRepository";

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
    getActor: async (url: string) => {
      return {
        data: {
          "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
          ],
          followers: "https://tl.ramda.io/u/myuon/followers",
          following: "https://tl.ramda.io/u/myuon/following",
          icon: {
            mediaType: "image/png",
            type: "Image",
            url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
          },
          id: "https://tl.ramda.io/u/myuon",
          inbox: "https://tl.ramda.io/u/myuon/inbox",
          name: "myuon",
          outbox: "https://tl.ramda.io/u/myuon/outbox",
          preferredUsername: "myuon",
          publicKey: {
            id: "https://tl.ramda.io/u/myuon#main-key",
            owner: "https://tl.ramda.io/u/myuon",
            publicKeyPem:
              "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx8F5dC8js0yM3HlpQuan\n7j9bQAPaH39loiHLssRm5vvSZSVVNODi9ch3PrKlW44aXd6puQjT8cyAkuzigloK\nU+iI2cnd/nCIvXe3qONysIMbYwV1gtoccdBOZMQ8UDW3VtcT2oWdE8cGjAeAdoaN\nM7bx3gDq1Qw9X6nlzkhL9rvLp4yaVWNmsR0fpCkZw9l3wQA441UryKMo2eZ/5zUj\n185d4JWAMXjH7Xqw/ufJPly3wphJYvN3YQaw+Ryij7ruvnL1WWwUNxxb3hihmS7x\nuAeSZcVr5Xh1A/wjGU+3OU2kg20nrjkxqK6kpnhp7yrPUBMSjF9CeDKSgBRAcBZQ\nywIDAQAB\n-----END PUBLIC KEY-----\n",
            type: "Key",
          },
          summary: "@myuon on tl.ramda.io",
          type: "Person",
          url: "https://tl.ramda.io/u/myuon",
        },
      };
    },
  },
  signer: {
    verify: async (ctx) => {
      if (ctx.request.headers.signature !== "test_signature") {
        ctx.throw(400, "invalid signature");
      }

      return undefined;
    },
  },
  jobScheduleRepository: newJobScheduleRepository(
    dataSource.getRepository(JobScheduleTable)
  ),
  plugins: {},
  fetchClient: {
    fetcher: async (url, init) => {
      console.log(`====== fetch: \n${url}: ${JSON.stringify(init)}`);

      if (
        url === "https://misskey.io/users/99bga7dd11" &&
        JSON.stringify(init) ===
          JSON.stringify({
            headers: {
              Accept: "application/activity+json",
            },
          })
      ) {
        return {
          data: JSON.stringify({
            "@context": [
              "https://www.w3.org/ns/activitystreams",
              "https://w3id.org/security/v1",
              {
                Emoji: "toot:Emoji",
                Hashtag: "as:Hashtag",
                PropertyValue: "schema:PropertyValue",
                _misskey_content: "misskey:_misskey_content",
                _misskey_quote: "misskey:_misskey_quote",
                _misskey_reaction: "misskey:_misskey_reaction",
                _misskey_talk: "misskey:_misskey_talk",
                _misskey_votes: "misskey:_misskey_votes",
                discoverable: "toot:discoverable",
                featured: "toot:featured",
                isCat: "misskey:isCat",
                manuallyApprovesFollowers: "as:manuallyApprovesFollowers",
                misskey: "https://misskey-hub.net/ns#",
                quoteUrl: "as:quoteUrl",
                schema: "http://schema.org#",
                sensitive: "as:sensitive",
                toot: "http://joinmastodon.org/ns#",
                value: "schema:value",
                vcard: "http://www.w3.org/2006/vcard/ns#",
              },
            ],
            discoverable: true,
            endpoints: {
              sharedInbox: "https://misskey.io/inbox",
            },
            featured:
              "https://misskey.io/users/99bga7dd11/collections/featured",
            followers: "https://misskey.io/users/99bga7dd11/followers",
            following: "https://misskey.io/users/99bga7dd11/following",
            icon: null,
            id: "https://misskey.io/users/99bga7dd11",
            image: null,
            inbox: "https://misskey.io/users/99bga7dd11/inbox",
            isCat: false,
            manuallyApprovesFollowers: false,
            name: null,
            outbox: "https://misskey.io/users/99bga7dd11/outbox",
            preferredUsername: "myuon",
            publicKey: {
              id: "https://misskey.io/users/99bga7dd11#main-key",
              owner: "https://misskey.io/users/99bga7dd11",
              publicKeyPem:
                "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA82LuuAV31/WKLN0vl5/R\nF/a2Airp2JVWLJZMuLJ4xLsJuZm6BXXue4+p/oykcCegpm/5mHz9apKnC03xN2by\nED1TFq1uj1w4iJB9EV6QsJMBZESpodF6fVW1ogehXuU6zrZpIfTN7lWsCHvslL7G\nQHM/Z1cKns5J3n0Hdpog/Dt7GP024fFsQ//ndTNXihdxtpqhbp3DslHqIeETZnB9\ntokQGQjkIDtwznVfGVh5ITM/IlRZsNC543cW1TXcub88GxbAmkCPLv2n4x5gWsMP\nNw6zlWvCp0xtLyZKoWGh5mXVN+m6IcnBIWc+oHglc81DkuhXVKZiBJV4OnFeGaYN\nINCPtB63yj1sDGyaIHKbhueux4NWYjJ9vR1OtUalq0+VHq3V3M0d0brYWmydbQZT\nEO2X+HI5yvcxyBr90XMVUOteSJa/hR1UeZrcJcDqYeHlwrrThXIO/WJgCFkVBGzO\nUHaZtKludkqYs38N+27Q5+spH2LHuhVRSLKBzEU2BMIrAhaEqwJTwv7vM+5tPnNM\nyUed+Is2rHOXwdUyklytesiWNCuH418NkXT5n+fqOPVI7X2+04GS1SsNJqsPWwWp\nZH6VgYSNdHy0D473dxGBltwRm9Ik0Og6zgmSUCRJRt2fx0aEDoDbq1vZmyUvSrFi\nhpvIHrjX6EAvk7morPLaBXcCAwEAAQ==\n-----END PUBLIC KEY-----\n",
              type: "Key",
            },
            sharedInbox: "https://misskey.io/inbox",
            summary: null,
            tag: [],
            type: "Person",
            url: "https://misskey.io/@myuon",
          }),
          status: 200,
          error: undefined,
        };
      }

      return {
        data: undefined,
      };
    },
  },
};

const app = newApp(authMiddleware, appContext);
const server = app.listen(Math.floor(Math.random() * 10000));
const request = supertest(server);

describe("api", () => {
  before(async () => {
    await dataSource.initialize();
    await initializeApp(appContext);
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
      assert.equal(
        delivered[0].to,
        "https://misskey.io/users/99bga7dd11/inbox"
      );
      assert.equal(delivered[0].activity.type, "Accept");
      assert.equal(delivered[0].activity.actor, userIdUrl);
    });

    it("GET /u/:userName", async () => {
      const resp = await request.get(`/u/${userName}`).expect(200);
      const body = resp.body;

      assert.deepEqual(body, {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          "https://w3id.org/security/v1",
        ],
        followers: "https://tl.ramda.io/u/myuon/followers",
        following: "https://tl.ramda.io/u/myuon/following",
        icon: {
          mediaType: "image/png",
          type: "Image",
          url: "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
        },
        id: "https://tl.ramda.io/u/myuon",
        inbox: "https://tl.ramda.io/u/myuon/inbox",
        name: "myuon",
        outbox: "https://tl.ramda.io/u/myuon/outbox",
        preferredUsername: "myuon",
        publicKey: {
          id: "https://tl.ramda.io/u/myuon#main-key",
          owner: "https://tl.ramda.io/u/myuon",
          publicKeyPem:
            "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx8F5dC8js0yM3HlpQuan\n7j9bQAPaH39loiHLssRm5vvSZSVVNODi9ch3PrKlW44aXd6puQjT8cyAkuzigloK\nU+iI2cnd/nCIvXe3qONysIMbYwV1gtoccdBOZMQ8UDW3VtcT2oWdE8cGjAeAdoaN\nM7bx3gDq1Qw9X6nlzkhL9rvLp4yaVWNmsR0fpCkZw9l3wQA441UryKMo2eZ/5zUj\n185d4JWAMXjH7Xqw/ufJPly3wphJYvN3YQaw+Ryij7ruvnL1WWwUNxxb3hihmS7x\nuAeSZcVr5Xh1A/wjGU+3OU2kg20nrjkxqK6kpnhp7yrPUBMSjF9CeDKSgBRAcBZQ\nywIDAQAB\n-----END PUBLIC KEY-----\n",
          type: "Key",
        },
        summary: "@myuon on tl.ramda.io",
        type: "Person",
        url: "https://tl.ramda.io/u/myuon",
      });
    });

    it("POST /api/follow", async () => {
      delivered = [];

      await request
        .post("/api/follow")
        .set("Authorization", "Bearer test_token")
        .send({ id: "myuon@tl.ramda.io" })
        .expect(204);
      assert.equal(delivered.length, 1);
      assert.equal(delivered[0].to, "https://tl.ramda.io/u/myuon/inbox");
      assert.equal(delivered[0].activity.type, "Follow");
      assert.equal(delivered[0].activity.actor, "https://tl.ramda.io/u/myuon");
      assert.equal(delivered[0].activity.object, "https://tl.ramda.io/u/myuon");
    });
  });
});
