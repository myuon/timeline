export interface Note {
  id: string;
  federatedId?: string;
  userId: string;
  content: string;
  createdAt: number;
}
