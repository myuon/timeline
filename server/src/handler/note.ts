import { Context } from "koa";
import { schemaForType } from "../helper/zod";
import { CreateNoteRequest } from "@/shared/request/note";
import { z } from "zod";
import { App } from "./app";
import { ulid } from "ulid";

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

  const note = {
    id: ulid(),
    userId: ctx.state.auth.uid,
    content: result.data.content,
    createdAt: Date.now(),
  };
  await app.noteRepository.create(note);

  ctx.status = 201;
};
