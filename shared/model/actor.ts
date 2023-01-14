export interface Actor {
  id: string;
  federatedId: string;
  rawData?: string;
  inboxUrl?: string;
  name?: string;
  summary?: string;
  url?: string;
  publicKeyPem?: string;
  iconUrl?: string;
}

export interface ActorPresented extends Actor {
  accountId?: string;
}

export const presentActor = (actor: Actor, domain: string) => {
  return {
    ...actor,
    accountId: actor.federatedId.startsWith(`https://${domain}`)
      ? actor.name
      : `${actor.name}@${new URL(actor.federatedId).hostname}`,
  };
};
