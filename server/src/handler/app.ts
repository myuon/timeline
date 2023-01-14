import { ParameterizedContext } from "koa";
import { ActorRepository } from "../infra/actorRepository";
import { FollowRelationRepository } from "../infra/followRelationRepository";
import { InboxItemRepository } from "../infra/inboxRepository";
import { NoteRepository } from "../infra/noteRepository";

export interface App {
  noteRepository: NoteRepository;
  followRelationRepository: FollowRelationRepository;
  actorRepository: ActorRepository;
  inboxItemRepository: InboxItemRepository;
}

export type Context = ParameterizedContext<{ app: App }>;
