export interface Activity {
  type: string;
  id?: string;
  published?: string;
  actor?: string;
  object?:
    | string
    | {
        id: string;
        type: string;
        content?: string;
      };
  target?: string;
  cc?: string[];
}
