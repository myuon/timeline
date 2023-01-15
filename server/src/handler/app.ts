import { ParameterizedContext } from "koa";
import { ActorRepository } from "../infra/actorRepository";
import { DeliveryClient } from "../infra/delivery";
import { FollowRelationRepository } from "../infra/followRelationRepository";
import { InboxItemRepository } from "../infra/inboxRepository";
import { NoteRepository } from "../infra/noteRepository";
import { ShareRepository } from "../infra/shareRepository";

export interface App {
  noteRepository: NoteRepository;
  followRelationRepository: FollowRelationRepository;
  actorRepository: ActorRepository;
  inboxItemRepository: InboxItemRepository;
  shareRepository: ShareRepository;
  deliveryClient: DeliveryClient;
}

export type Context = ParameterizedContext<{ app: App }>;
