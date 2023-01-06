import { Note } from "@/shared/model/note";
import dayjs from "dayjs";
import { serializeApNote } from "./note";

export const serializeCreateNoteActivity = (
  userId: string,
  to: string,
  note: Note
) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${userId}/s/${note.id}/activity`,
    type: "Create",
    actor: userId,
    cc: [`${userId}/followers`],
    to: [to],
    object: serializeApNote(userId, note),
    published: dayjs(note.createdAt).toDate().toUTCString(),
  };
};
