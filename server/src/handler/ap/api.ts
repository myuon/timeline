import { z } from "zod";
import { schemaForType } from "../../helper/zod";
import { fetcher, FetcherResult } from "../../helper/fetcher";

export const getInbox = async (
  actor: string
): Promise<FetcherResult<string>> => {
  const { data, error } = await fetcher(actor, {
    headers: {
      Accept: "application/activity+json",
    },
  });
  if (error || !data) {
    return { error };
  }

  const schema = schemaForType<{ inbox: string }>()(
    z.object({
      inbox: z.string(),
    })
  );
  const result = schema.safeParse(JSON.parse(data));
  if (!result.success) {
    return { error: result.error };
  }

  return { data: result.data.inbox };
};

interface ApActor {
  id: string;
  inbox?: string;
  followers?: string;
  following?: string;
  icon?: {
    url?: string;
  };
  name?: string;
  preferredUsername?: string;
  publicKey?: {
    publicKeyPem?: string;
  };
  summary?: string;
  url?: string;
}

export const getActor = async (
  actor: string
): Promise<FetcherResult<ApActor>> => {
  const { data, error } = await fetcher(actor, {
    headers: {
      Accept: "application/activity+json",
    },
  });
  if (error || !data) {
    return { error };
  }

  const schema = schemaForType<ApActor>()(
    z.object({
      id: z.string(),
      inbox: z.string().optional(),
      followers: z.string().optional(),
      following: z.string().optional(),
      icon: z
        .object({
          url: z.string().optional(),
        })
        .optional(),
      name: z.string().optional(),
      preferredUsername: z.string().optional(),
      publicKey: z
        .object({
          publicKeyPem: z.string().optional(),
        })
        .optional(),
      summary: z.string().optional(),
      url: z.string().optional(),
    })
  );
  const result = schema.safeParse(JSON.parse(data));
  if (!result.success) {
    return { error: result.error };
  }

  return { data: result.data };
};
