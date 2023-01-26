import { schemaForType } from "../../helper/zod";
import z from "zod";
import { ApObject } from "./object";

export interface ApActivity {
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
  to?: string[];
}

export const schemaForActivity = schemaForType<ApActivity>()(
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
    to: z.array(z.string()).optional(),
  })
);

export const newApActivity = (
  type: string,
  input: {
    activityId: string;
    actor: string;
    cc?: string[];
    to?: string[];
    object: ApObject | string;
    published: string;
  }
): ApActivity & { "@context": unknown } => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: input.activityId,
    type,
    actor: input.actor,
    cc: input.cc,
    to: input.to,
    object: input.object,
    published: input.published,
  };
};

export const newApCreate = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: ApObject;
  published: string;
}) => {
  return newApActivity("Create", input);
};

export const newApDelete = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: string;
  published: string;
}) => {
  return newApActivity("Delete", input);
};

export const newApFollow = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: string;
  published: string;
}) => {
  return newApActivity("Follow", input);
};

export const newApLike = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: string;
  published: string;
}) => {
  return newApActivity("Like", input);
};

export const newApUpdate = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: ApObject;
  published: string;
}) => {
  return newApActivity("Update", input);
};

export const newApUndo = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: ApObject;
  published: string;
}) => {
  return newApActivity("Undo", input);
};

export const newApAnnounce = (input: {
  activityId: string;
  actor: string;
  cc?: string[];
  to?: string[];
  object: string;
  published: string;
}) => {
  return newApActivity("Announce", input);
};
