import { Context } from "koa";
import { schemaForType } from "../helper/zod";
import { CreateNoteRequest } from "@/shared/request/note";
import { z } from "zod";
import { App } from "./app";
import { ulid } from "ulid";
import { domain, userFirebaseId, userName } from "../config";
import { Note } from "@/shared/model/note";
import dayjs from "dayjs";
import escape from "escape-html";

const transformContent = (content: string) => {
  const escaped = escape(content);
  return `<p>${escaped
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')
    .split("\n")
    .reduce((x, y) => x + "<br />" + y)}</p>`;
};

export const createNote = async (app: App, ctx: Context) => {
  const schema = schemaForType<CreateNoteRequest>()(
    z.object({
      content: z.string(),
    })
  );
  const result = schema.safeParse(ctx.request.body);
  if (!result.success) {
    ctx.throw(400, result.error);
  }

  if (ctx.state.auth.uid !== userFirebaseId) {
    ctx.throw(401, "Unauthorized");
  }

  const note: Note = {
    id: ulid(),
    userId: `https://${domain}/u/${userName}`,
    content: transformContent(result.data.content),
    rawContent: result.data.content,
    createdAt: dayjs().unix(),
  };
  await app.noteRepository.create(note);

  ctx.status = 201;

  return note;
};
