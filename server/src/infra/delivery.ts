import { z } from "zod";
import { Activity } from "../protocols/ap/activity";
import { signedFetcher } from "../helper/signedFetcher";
import { schemaForType } from "../helper/zod";
import { Fetcher } from "./fetchClient";

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

export const newDeliveryClient = (
  signKey: {
    privateKeyPemString: string;
    keyId: string;
  },
  fetcher: Fetcher
) => {
  return {
    deliveryActivity: async (inbox: string, activity: Activity) => {
      return await signedFetcher(signKey, fetcher, inbox, {
        method: "post",
        body: activity,
      });
    },
    getActor: async (actorUrl: string) => {
      const schemaApActor = schemaForType<ApActor>()(
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

      const { data, error, status } = await fetcher(actorUrl, {
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
    },
  };
};

export type DeliveryClient = ReturnType<typeof newDeliveryClient>;
