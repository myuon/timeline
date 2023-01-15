import { ActorTable } from "./actorRepository";
import { FollowRelationTable } from "./followRelationRepository";
import { InboxItemTable } from "./inboxRepository";
import { NoteTable } from "./noteRepository";
import { ShareTable } from "./shareRepository";

export const entities = [
  NoteTable,
  FollowRelationTable,
  ActorTable,
  InboxItemTable,
  ShareTable,
];
