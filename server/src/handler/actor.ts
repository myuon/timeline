import { getActor } from "./ap/api";
import { Context } from "./app";

export const syncActor = async (ctx: Context, url: string) => {
  const { data, error } = await getActor(
    ctx.state.app.fetchClient.fetcher,
    url
  );
  if (!data || error) {
    ctx.log.warn(error);
    ctx.throw(400, "Failed to get actor");
  }

  const name = data.preferredUsername || data.name;
  if (!name) {
    ctx.throw(400, "No name for actor");
  }

  if (!data.inbox) {
    ctx.throw(400, "No inbox for actor");
  }

  if (!data.url) {
    ctx.throw(400, "No url for actor");
  }

  await ctx.state.app.actorRepository.save({
    userId: `${name}@${new URL(data.id).hostname}`,
    rawData: JSON.stringify(data),
    inboxUrl: data.inbox,
    name,
    summary: data.summary ?? "",
    url: data.url,
    publicKeyPem: data.publicKey?.publicKeyPem,
    iconUrl: data.icon?.url,
    federatedId: data.id,
  });
};
