export interface Actor {
  userId: string;
  rawData?: string;
  inboxUrl: string;
  name: string;
  summary: string;
  url: string;
  publicKeyPem?: string;
  iconUrl?: string;
}
