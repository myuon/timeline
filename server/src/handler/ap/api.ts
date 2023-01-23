import { z } from "zod";
import { schemaForType } from "../../helper/zod";
import { FetcherResult } from "../../helper/fetcher";
import { Fetcher } from "../../infra/fetchClient";

interface ApActor {
  id: string;
  inbox?: string;
  followers?: string;
  following?: string;
  icon?: {
    url?: string;
  } | null;
  name?: string | null;
  preferredUsername?: string;
  publicKey?: {
    publicKeyPem?: string;
  };
  summary?: string | null;
  url?: string;
}

export const schemaApActor = schemaForType<ApActor>()(
  z.object({
    id: z.string(),
    inbox: z.string().optional(),
    followers: z.string().optional(),
    following: z.string().optional(),
    icon: z
      .object({
        url: z.string().optional(),
      })
      .nullable()
      .optional(),
    name: z.string().optional().nullable(),
    preferredUsername: z.string().optional(),
    publicKey: z
      .object({
        publicKeyPem: z.string().optional(),
      })
      .optional(),
    summary: z.string().nullable().optional(),
    url: z.string().optional(),
  })
);

export const getActor = async (
  fetcher: Fetcher,
  actor: string
): Promise<FetcherResult<ApActor | undefined>> => {
  const { data, error, status } = await fetcher(actor, {
    headers: {
      Accept: "application/activity+json",
    },
  });
  if (status === 410) {
    // If actor is Gone, this is a deleted user and cannot get any more data
    return { data: undefined };
  }

  if (error || !data) {
    return { error };
  }

  const result = schemaApActor.safeParse(JSON.parse(data));
  if (!result.success) {
    return { error: result.error };
  }

  return { data: result.data };
};
