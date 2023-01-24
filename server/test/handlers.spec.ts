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
      } else if (
        url === "https://unnerv.jp/users/Tokyo" &&
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
                Curve25519Key: "toot:Curve25519Key",
                Device: "toot:Device",
                Ed25519Key: "toot:Ed25519Key",
                Ed25519Signature: "toot:Ed25519Signature",
                EncryptedMessage: "toot:EncryptedMessage",
                IdentityProof: "toot:IdentityProof",
                PropertyValue: "schema:PropertyValue",
                alsoKnownAs: {
                  "@id": "as:alsoKnownAs",
                  "@type": "@id",
                },
                cipherText: "toot:cipherText",
                claim: {
                  "@id": "toot:claim",
                  "@type": "@id",
                },
                deviceId: "toot:deviceId",
                devices: {
                  "@id": "toot:devices",
                  "@type": "@id",
                },
                discoverable: "toot:discoverable",
                featured: {
                  "@id": "toot:featured",
                  "@type": "@id",
                },
                featuredTags: {
                  "@id": "toot:featuredTags",
                  "@type": "@id",
                },
                fingerprintKey: {
                  "@id": "toot:fingerprintKey",
                  "@type": "@id",
                },
                focalPoint: {
                  "@container": "@list",
                  "@id": "toot:focalPoint",
                },
                identityKey: {
                  "@id": "toot:identityKey",
                  "@type": "@id",
                },
                manuallyApprovesFollowers: "as:manuallyApprovesFollowers",
                messageFranking: "toot:messageFranking",
                messageType: "toot:messageType",
                movedTo: {
                  "@id": "as:movedTo",
                  "@type": "@id",
                },
                publicKeyBase64: "toot:publicKeyBase64",
                schema: "http://schema.org#",
                suspended: "toot:suspended",
                toot: "http://joinmastodon.org/ns#",
                value: "schema:value",
              },
            ],
            attachment: [],
            devices: "https://unnerv.jp/users/Tokyo/collections/devices",
            discoverable: false,
            endpoints: {
              sharedInbox: "https://unnerv.jp/inbox",
            },
            featured: "https://unnerv.jp/users/Tokyo/collections/featured",
            featuredTags: "https://unnerv.jp/users/Tokyo/collections/tags",
            followers: "https://unnerv.jp/users/Tokyo/followers",
            following: "https://unnerv.jp/users/Tokyo/following",
            icon: {
              mediaType: "image/png",
              type: "Image",
              url: "https://media.unnerv.jp/accounts/avatars/000/000/060/original/9b07ce2b431e6639.png",
            },
            id: "https://unnerv.jp/users/Tokyo",
            inbox: "https://unnerv.jp/users/Tokyo/inbox",
            manuallyApprovesFollowers: false,
            name: "東京都",
            outbox: "https://unnerv.jp/users/Tokyo/outbox",
            preferredUsername: "Tokyo",
            publicKey: {
              id: "https://unnerv.jp/users/Tokyo#main-key",
              owner: "https://unnerv.jp/users/Tokyo",
              publicKeyPem:
                "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1MgXDu8aOORXJ3G8JZsZ\n+Cq4GBF9VeBWyNJ8JnxNW2xue/zFPkKjlb3Kzcb65W0wzJbB/fp2FGirDTHEaxZe\nRKZ6axxbaRL2pOyYnhY2t9I6akuD7xFIKpjUXrLI5PvR7ydXMEzBS1FYebE2LMra\nuXrmh/mcVn9mhcRzpc4Jpw2DAOEXb4yi2gKEcG3J2+EOHASjEDOdHPYuYWkuh8x4\n/WhqBTuH7lCsLirJvbiDFdi1NlRj69REuayCvTgXMCHXK7NM6qEJeXd65GWqU1oC\nnhny1/pGxhgKF/GEMr8CJGkqNwGEkdScr8SqtSHMcYEF02lV/0tcWFWbYCL7ZbYd\nGwIDAQAB\n-----END PUBLIC KEY-----\n",
            },
            published: "2017-04-16T00:00:00Z",
            summary: "<p>東京都の情報を配信します。</p>",
            tag: [],
            type: "Person",
            url: "https://unnerv.jp/@Tokyo",
          }),
          status: 200,
        };
      } else if (
        url === "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118" &&
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
              {
                Hashtag: "as:Hashtag",
                atomUri: "ostatus:atomUri",
                conversation: "ostatus:conversation",
                inReplyToAtomUri: "ostatus:inReplyToAtomUri",
                ostatus: "http://ostatus.org#",
                sensitive: "as:sensitive",
                toot: "http://joinmastodon.org/ns#",
                votersCount: "toot:votersCount",
              },
            ],
            atomUri:
              "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118",
            attachment: [],
            attributedTo: "https://unnerv.jp/users/UN_NERV",
            cc: ["https://unnerv.jp/users/UN_NERV/followers"],
            content:
              '<p>【強い冬型の気圧配置に関する全般気象情報 2023年01月21日 15:01】<br />24日から26日頃にかけて、日本付近は強い冬型の気圧配置となるため、北日本から西日本にかけての日本海側を中心に大荒れや大しけ、大雪となる所があります。<br /><a href="https://unnerv.jp/tags/%E5%85%A8%E8%88%AC%E6%B0%97%E8%B1%A1%E6%83%85%E5%A0%B1" class="mention hashtag" rel="tag">#<span>全般気象情報</span></a></p>',
            contentMap: {
              ja: '<p>【強い冬型の気圧配置に関する全般気象情報 2023年01月21日 15:01】<br />24日から26日頃にかけて、日本付近は強い冬型の気圧配置となるため、北日本から西日本にかけての日本海側を中心に大荒れや大しけ、大雪となる所があります。<br /><a href="https://unnerv.jp/tags/%E5%85%A8%E8%88%AC%E6%B0%97%E8%B1%A1%E6%83%85%E5%A0%B1" class="mention hashtag" rel="tag">#<span>全般気象情報</span></a></p>',
            },
            conversation:
              "tag:unnerv.jp,2023-01-21:objectId=1262670:objectType=Conversation",
            id: "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118",
            inReplyTo: null,
            inReplyToAtomUri: null,
            published: "2023-01-21T06:01:56Z",
            replies: {
              first: {
                items: [],
                next: "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118/replies?only_other_accounts=true&page=true",
                partOf:
                  "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118/replies",
                type: "CollectionPage",
              },
              id: "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118/replies",
              type: "Collection",
            },
            sensitive: false,
            summary: null,
            tag: [
              {
                href: "https://unnerv.jp/tags/%E5%85%A8%E8%88%AC%E6%B0%97%E8%B1%A1%E6%83%85%E5%A0%B1",
                name: "#全般気象情報",
                type: "Hashtag",
              },
            ],
            to: ["https://www.w3.org/ns/activitystreams#Public"],
            type: "Note",
            url: "https://unnerv.jp/@UN_NERV/109725674147055118",
          }),
          status: 200,
        };
      }

      return {
        data: undefined,
      };
    },
  },
};

const app = newApp(authMiddleware, appContext);
const server = app.listen(5987);
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
      await appContext.followRelationRepository.create({
        userId,
        targetUserId: "Tokyo@unnerv.jp",
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

    it("POST announce /inbox", async () => {
      delivered = [];

      await request
        .post(`/u/${userName}/inbox`)
        .set("signature", "test_signature")
        .send({
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://unnerv.jp/users/Tokyo/statuses/109725674344355482/activity",
          type: "Announce",
          actor: "https://unnerv.jp/users/Tokyo",
          published: "2023-01-21T06:01:59Z",
          to: ["https://www.w3.org/ns/activitystreams#Public"],
          cc: [
            "https://unnerv.jp/users/UN_NERV",
            "https://unnerv.jp/users/Tokyo/followers",
          ],
          object: "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118",
        })
        .expect(200);

      const note = await appContext.noteRepository.findByFederatedId(
        "https://unnerv.jp/users/UN_NERV/statuses/109725674147055118"
      );
      assert.notEqual(note, undefined);

      const items = await appContext.inboxItemRepository.findByItemId(
        "Share",
        note!.id
      );
      assert.equal(items.length, 1);
      assert.equal(items[0].userId, userId);
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
