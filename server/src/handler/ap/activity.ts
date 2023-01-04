import { Note } from "@/shared/model/note";
import dayjs from "dayjs";
import { serializeApNote } from "./note";

export const serializeCreateNoteActivity = (userId: string, note: Note) => {
  return {
    id: `${userId}/s/${note.id}/activity`,
    type: "Create",
    actor: userId,
    cc: [`${userId}/followers`],
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    object: serializeApNote(userId, note),
    published: dayjs(note.createdAt).toDate().toUTCString(),
  };
};
