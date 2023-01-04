import { Note } from "@/shared/model/note";

export const serializeApNote = (userId: string, note: Note) => {
  return {
    type: "Note",
    id: `${userId}/s/${note.id}`,
    attributedTo: userId,
    content: note.content,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [],
    url: `${userId}/s/${note.id}`,
  };
};
