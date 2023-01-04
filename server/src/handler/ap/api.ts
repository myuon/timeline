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
