import { Note } from "../../../../shared/model/note";
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
    published: dayjs.unix(note.createdAt).toDate().toUTCString(),
  };
};

export const serializeDeleteNoteActivity = (
  userId: string,
  id: string,
  objectId: string
) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${userId}/activity/${id}`,
    type: "Delete",
    actor: userId,
    object: objectId,
    published: dayjs().toDate().toUTCString(),
  };
};

export const serializeFollowActivity = (
  userId: string,
  id: string,
  objectId: string
) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${userId}/activity/${id}`,
    type: "Follow",
    actor: userId,
    object: objectId,
    published: dayjs().toDate().toUTCString(),
  };
};

export const serializeUndoActivity = (
  userId: string,
  id: string,
  objectId: string
) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${userId}/activity/${id}`,
    type: "Undo",
    actor: userId,
    object: objectId,
    published: dayjs().toDate().toUTCString(),
  };
};
