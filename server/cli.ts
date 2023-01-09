import dayjs from "dayjs";
import { ulid } from "ulid";
import { userId } from "./src/config";
import {
  serializeCreateNoteActivity,
  serializeDeleteNoteActivity,
  serializeFollowActivity,
  serializeUndoActivity,
} from "./src/handler/ap/activity";
import { deliveryActivity } from "./src/handler/ap/delivery";

export const run = async () => {
  const command = process.argv[2];
  if (command === "toot") {
    const to = process.argv[3];
    if (!to) {
      console.log("Usage: yarn cli toot <to>");
      return;
    }

    const activity = serializeCreateNoteActivity(
      userId,
      "https://www.w3.org/ns/activitystreams#Public",
      {
        id: dayjs().unix().toString(),
        userId,
        content: `<p>Toot!, ${dayjs().format("YYYY-MM-DD HH:mm:ss")}</p>`,
        rawContent: "",
        createdAt: dayjs().unix(),
      }
    );

    console.log(`Sending activity: ${JSON.stringify(activity, null, 2)}`);
    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else if (command === "reply") {
    const to = process.argv[3];
    const inReplyTo = process.argv[4];
    if (!to || !inReplyTo) {
      console.log("Usage: yarn cli reply <to> <inReplyTo>");
      return;
    }

    const activity = serializeCreateNoteActivity(
      userId,
      "https://www.w3.org/ns/activitystreams#Public",
      {
        id: dayjs().unix().toString(),
        userId,
        content: `<p>Hello, world!, ${dayjs().format(
          "YYYY-MM-DD HH:mm:ss"
        )}</p>`,
        rawContent: "",
        createdAt: dayjs().unix(),
      }
    );
    activity.object.inReplyTo = inReplyTo;

    console.log(`Sending activity: ${JSON.stringify(activity, null, 2)}`);
    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else if (command === "delete") {
    const to = process.argv[3];
    const url = process.argv[4];
    if (!to || !url) {
      console.log("Usage: yarn cli delete <to> <url>");
      return;
    }

    const activity = serializeDeleteNoteActivity(userId, url, url);

    console.log(`Sending activity: ${JSON.stringify(activity, null, 2)}`);
    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else if (command === "follow") {
    const to = process.argv[3];
    if (!to) {
      console.log("Usage: yarn cli follow <to>");
      return;
    }

    const activity = serializeFollowActivity(userId, ulid(), to);

    console.log(`Sending activity: ${JSON.stringify(activity, null, 2)}`);
    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else if (command === "undo") {
    const to = process.argv[3];
    const url = process.argv[4];
    if (!to || !url) {
      console.log("Usage: yarn cli undo <to> <url>");
      return;
    }

    const activity = serializeUndoActivity(userId, ulid(), url);

    console.log(`Sending activity: ${JSON.stringify(activity, null, 2)}`);
    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else {
    console.log(`Unknown command: ${command}`);
  }

  return;
};

void run();
