export interface Person {
  "@context": string | string[];
  type: "Person";
  id: string;
  following: string;
  followers: string;
  inbox: string;
  outbox: string;
  preferredUsername: string;
  name: string;
  summary: string;
  icon: {
    type: string;
    url: string;
  };
  url: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}
