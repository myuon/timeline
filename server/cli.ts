import dayjs from "dayjs";
import { userId } from "./src/config";
import { serializeCreateNoteActivity } from "./src/handler/ap/activity";
import { deliveryActivity } from "./src/handler/ap/delivery";

export const run = async () => {
  const command = process.argv[2];
  if (command === "toot") {
    const to = process.argv[3];
    if (!to) {
      console.log("Usage: yarn cli toot <to>");
      return;
    }

    const resp = await deliveryActivity(
      to,
      serializeCreateNoteActivity(userId, to, {
        id: "1",
        userId,
        content: `<p>Hello, world!, ${dayjs().format(
          "YYYY-MM-DD HH:mm:ss"
        )}</p>`,
        createdAt: dayjs().unix(),
      })
    );
    console.log(resp);
  } else if (command === "reply") {
    const to = process.argv[3];
    const inReplyTo = process.argv[4];
    if (!to || !inReplyTo) {
      console.log("Usage: yarn cli reply <to> <inReplyTo>");
      return;
    }

    const activity = serializeCreateNoteActivity(userId, to, {
      id: "1",
      userId,
      content: `<p>Hello, world!, ${dayjs().format("YYYY-MM-DD HH:mm:ss")}</p>`,
      createdAt: dayjs().unix(),
    });
    activity.object.inReplyTo = inReplyTo;

    const resp = await deliveryActivity(to, activity);
    console.log(resp);
  } else {
    console.log(`Unknown command: ${command}`);
  }

  return;
};

void run();
