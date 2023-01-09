export interface Note {
  id: string;
  federatedId?: string;
  userId: string;
  content: string;
  rawContent: string;
  createdAt: number;
}
