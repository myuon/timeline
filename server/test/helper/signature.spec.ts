import { importVerifyKey, verifyHttpHeaders } from "../../src/helper/signature";
import assert from "assert";

const samplePublicKey =
  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqkZnGNjn1KOO+Dg8KmS5\nERL3E8PX3Ty5Zcqrcd/FSjANTvoRIupzRYl+v186ezQYQdHpzIBlhLsFMTceVC3J\nDwlBfcfNJWG6jP0GpM8ClXr/ZlJpBkCtd0Sz4F+Yn+XWyFZGkbaq7GbQfPCnpgFy\nMrgTxiri2lnXrmnweMJ7bvCg6iwsZfWyR1tQIyaOmvvJRecqIq1Khua6Opn0S/x4\n07ya5OdvZ6H1rVtKczkdK29OFqpXRH2LYil/RsInBg5gO7NGBq9J/dBuCg8eUc4s\nGFctmv2vCL9CKHGk/NN+/x/mbaJVW5baMSCoUc6Q17Wvbpfr7IS1j8Yksz9s+fRg\nsQIDAQAB\n-----END PUBLIC KEY-----\n";

it("should import a public key", async () => {
  await assert.doesNotReject(async () => {
    await importVerifyKey(samplePublicKey);
  });
});

it("should verify a signature", async () => {
  const verifyKey = await importVerifyKey(samplePublicKey);

  const { error } = await verifyHttpHeaders(
    verifyKey,
    ["host", "date", "digest", "content-type", "collection-synchronization"],
    "WN66XiBJhXcKlAGowCoR80qwJaHqN9NRzxXo3SWn8sTs3Y17dm787QxxDokfRw5qLqvtI02dMzLl1+zH86nfDQQBiiKt0LdBrDh2ijT2cII0EaxgxMdPWH6mCvZNmK4MEn6YGA2Rc/BH0wVkQWRHVlmplFjKtaF/DhMtKpTVcukxRXFfaUxrjfv5kpwloOl817CoJaqlxPlIHje2W1tTP+aB+QJ7+OguVd0ZFokCRFR/rI92OtuohbPqGjfdmSMkKCY583udH4tdfO8Hrn2NTnK9JJ9oYyhtwo46XIhQscOuYAvm8eNGH9pP4noNu0AmWeC5pMTB5WT/wTcI4ZKS/w==",
    {
      path: "/u/myuon/inbox",
      method: "post",
      body: {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          {
            ostatus: "http://ostatus.org#",
            atomUri: "ostatus:atomUri",
            inReplyToAtomUri: "ostatus:inReplyToAtomUri",
            conversation: "ostatus:conversation",
            sensitive: "as:sensitive",
            toot: "http://joinmastodon.org/ns#",
            votersCount: "toot:votersCount",
          },
        ],
        id: "https://pawoo.net/users/myuon/statuses/109657944180639959/activity",
        type: "Create",
        actor: "https://pawoo.net/users/myuon",
        published: "2023-01-09T06:57:19Z",
        to: ["https://tl.ramda.io/u/myuon"],
        cc: [],
        object: {
          id: "https://pawoo.net/users/myuon/statuses/109657944180639959",
          type: "Note",
          summary: null,
          inReplyTo: "https://tl.ramda.io/u/myuon/s/01GPAKH8R82AJPXHRTEVKCCZMY",
          published: "2023-01-09T06:57:19Z",
          url: "https://pawoo.net/@myuon/109657944180639959",
          attributedTo: "https://pawoo.net/users/myuon",
          to: ["https://tl.ramda.io/u/myuon"],
          cc: [],
          sensitive: false,
          atomUri: "https://pawoo.net/users/myuon/statuses/109657944180639959",
          inReplyToAtomUri:
            "https://tl.ramda.io/u/myuon/s/01GPAKH8R82AJPXHRTEVKCCZMY",
          conversation:
            "tag:pawoo.net,2023-01-09:objectId=360037052:objectType=Conversation",
          content:
            '<p><span class="h-card"><a href="https://tl.ramda.io/u/myuon" class="u-url mention">@<span>myuon</span></a></span> Yo</p>',
          contentMap: {
            ja: '<p><span class="h-card"><a href="https://tl.ramda.io/u/myuon" class="u-url mention">@<span>myuon</span></a></span> Yo</p>',
          },
          attachment: [],
          tag: [
            {
              type: "Mention",
              href: "https://tl.ramda.io/u/myuon",
              name: "@myuon@tl.ramda.io",
            },
          ],
          replies: {
            id: "https://pawoo.net/users/myuon/statuses/109657944180639959/replies",
            type: "Collection",
            first: {
              type: "CollectionPage",
              next: "https://pawoo.net/users/myuon/statuses/109657944180639959/replies?only_other_accounts=true&page=true",
              partOf:
                "https://pawoo.net/users/myuon/statuses/109657944180639959/replies",
              items: [],
            },
          },
        },
      },
      headers: {
        "accept-encoding": "gzip",
        "collection-synchronization":
          'collectionId="https://pawoo.net/users/myuon/followers", digest="e28615fcdaa0ab711729b64e7f6fa7d22e64ac6236b39661247d27b839b83654", url="https://pawoo.net/users/myuon/followers_synchronization"',
        "content-length": "1848",
        "content-type": "application/activity+json",
        date: "Mon, 09 Jan 2023 06:57:19 GMT",
        digest: "SHA-256=90m3gPpgMrQ1gYwJorpoecsIapzWEXJoNFt1VqJhSVo=",
        forwarded: 'for="203.137.164.248";proto=https',
        host: "tl.ramda.io",
        signature:
          'keyId="https://pawoo.net/users/myuon#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest content-type collection-synchronization",signature="WN66XiBJhXcKlAGowCoR80qwJaHqN9NRzxXo3SWn8sTs3Y17dm787QxxDokfRw5qLqvtI02dMzLl1+zH86nfDQQBiiKt0LdBrDh2ijT2cII0EaxgxMdPWH6mCvZNmK4MEn6YGA2Rc/BH0wVkQWRHVlmplFjKtaF/DhMtKpTVcukxRXFfaUxrjfv5kpwloOl817CoJaqlxPlIHje2W1tTP+aB+QJ7+OguVd0ZFokCRFR/rI92OtuohbPqGjfdmSMkKCY583udH4tdfO8Hrn2NTnK9JJ9oYyhtwo46XIhQscOuYAvm8eNGH9pP4noNu0AmWeC5pMTB5WT/wTcI4ZKS/w=="',
      },
    }
  );
  assert.equal(error, undefined);
});
