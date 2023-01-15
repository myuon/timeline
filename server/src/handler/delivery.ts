import { Activity } from "../../../shared/model/activity";
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
      const { data, error } =
        await ctx.state.app.deliveryClient.deliveryActivity(
          follower.userId,
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
