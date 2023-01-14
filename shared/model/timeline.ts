import { InboxItem } from "./inbox";
import { ActorPresented } from "./actor";
import { Note } from "./note";

export interface TimelineObject extends InboxItem {
  actor?: ActorPresented;
  note?: Note;
}
