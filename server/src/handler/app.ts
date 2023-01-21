import { ParameterizedContext } from "koa";
import { ActorRepository } from "../infra/actorRepository";
import { DeliveryClient } from "../infra/delivery";
import { FollowRelationRepository } from "../infra/followRelationRepository";
import { InboxItemRepository } from "../infra/inboxRepository";
import { JobScheduleRepository } from "../infra/jobScheduleRepository";
import { NoteRepository } from "../infra/noteRepository";
import { ShareRepository } from "../infra/shareRepository";
import { Signer } from "../infra/signer";

export interface App {
  noteRepository: NoteRepository;
  followRelationRepository: FollowRelationRepository;
  actorRepository: ActorRepository;
  inboxItemRepository: InboxItemRepository;
  shareRepository: ShareRepository;
  deliveryClient: DeliveryClient;
  signer: Signer;
  jobScheduleRepository: JobScheduleRepository;
  plugins: Record<
    string,
    {
      onScheduledRun: (app: App) => Promise<void>;
    }
  >;
}

export type Context = ParameterizedContext<{ app: App }>;
