import { Activity } from "../protocols/ap/activity";
import { Context } from "./app";

export const deliveryActivityToFollowers = async (
  ctx: Context,
  activity: Activity,
  userId: string
) => {
  const followers = await ctx.state.app.followRelationRepository.findFollowers(
    userId
  );

  await Promise.allSettled(
    followers.map(async (follower) => {
      const actor = await ctx.state.app.actorRepository.findByUserId(
        follower.userId
      );
      if (!actor) {
        ctx.log.error(
          `deliveryActivityToFollowers: actor not found: ${follower.userId}`
        );
        return;
      }

      const { data, error } =
        await ctx.state.app.deliveryClient.deliveryActivity(
          actor.inboxUrl,
          activity
        );
      if (error) {
        ctx.log.error(error);
        return;
      }

      ctx.log.info(`deliveryActivity: ${data}`);
    })
  );
};
