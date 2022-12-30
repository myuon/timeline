import { Context } from "koa";
import { App } from "./app";
import { Activity } from "@/shared/model/activity";
import { domain, userName } from "../config";

export const follow = async (app: App, ctx: Context, activity: Activity) => {
  if (activity.target !== `https://${domain}/u/${userName}`) {
    ctx.throw(400, "Bad request");
  }

  ctx.status = 200;
};
