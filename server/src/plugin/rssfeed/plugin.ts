import { App } from "../../handler/app";
import { RssConfigRepository } from "./infra/rssConfigRepository";
import Parser from "rss-parser";
import { ulid } from "ulid";
import dayjs from "dayjs";
import { userId } from "../../config";

export const onScheduledRun = async (app: App, repo: RssConfigRepository) => {
  const parser = new Parser();

  const configs = await repo.findAll();
  await Promise.all(
    configs.map(async (config) => {
      const feed = await parser.parseURL(config.url);

      const noteId = ulid();
      await app.noteRepository.create({
        id: noteId,
        userId: "plugin:rssfeed",
        createdAt: dayjs().unix(),
        content: `<h3>${feed.title}</h3>

<ul>${feed.items.map(
          (item) => `<li><a href="${item.link}">${item.title}</a></li>\n`
        )}</ul>
`,
        rawContent: `${feed.title}

${feed.items.map((item) => `- ${item.title} (${item.link})\n`)}`,
      });
      await app.inboxItemRepository.create({
        id: ulid(),
        type: "Note",
        userId,
        itemId: noteId,
        createdAt: dayjs().unix(),
      });
    })
  );

  return;
};
