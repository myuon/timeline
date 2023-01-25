import { schemaForType } from "../../helper/zod";
import z from "zod";

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

export const schemaForActivity = schemaForType<Activity>()(
  z.object({
    type: z.string(),
    published: z.string().optional(),
    actor: z.string().optional(),
    object: z
      .string()
      .or(
        z.object({
          id: z.string(),
          type: z.string(),
          content: z.string().optional(),
        })
      )
      .optional(),
    target: z.string().optional(),
    cc: z.array(z.string()).optional(),
  })
);
