import assert from "assert";
import { schemaApActor } from "../../src/handler/ap/api";

it("should parse actor object", async () => {
  const result = schemaApActor.safeParse({
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
    featured: "https://misskey.io/users/99bga7dd11/collections/featured",
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
  });

  assert.equal(result.success, true, `${JSON.stringify(result)}`);
});
