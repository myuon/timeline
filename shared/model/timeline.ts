import { InboxItem } from "./inbox";
import { Actor } from "./actor";
import { Note } from "./note";

export interface TimelineObject extends InboxItem {
  actor?: Actor;
  note?: Note;
}
