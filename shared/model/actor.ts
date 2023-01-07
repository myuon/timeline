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
