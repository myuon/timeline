import { Column, Entity, In, PrimaryColumn, Repository } from "typeorm";
import { Actor } from "../../../shared/model/actor";

@Entity()
export class ActorTable {
  @PrimaryColumn({ length: 100 })
  userId: string;

  @Column({ nullable: true })
  rawData?: string;

  @Column()
  inboxUrl: string;

  @Column()
  name: string;

  @Column()
  summary: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  publicKeyPem?: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @Column({ nullable: true })
  federatedId?: string;

  static fromModel(actor: Actor): ActorTable {
    const actorTable = new ActorTable();
    actorTable.userId = actor.userId;
    actorTable.rawData = actor.rawData;
    actorTable.inboxUrl = actor.inboxUrl;
    actorTable.name = actor.name;
    actorTable.summary = actor.summary;
    actorTable.url = actor.url;
    actorTable.publicKeyPem = actor.publicKeyPem;
    actorTable.iconUrl = actor.iconUrl;
    actorTable.federatedId = actor.federatedId;
    return actorTable;
  }

  toModel(): Actor {
    return {
      userId: this.userId,
      rawData: this.rawData,
      inboxUrl: this.inboxUrl,
      name: this.name,
      summary: this.summary,
      url: this.url,
      publicKeyPem: this.publicKeyPem,
      iconUrl: this.iconUrl,
      federatedId: this.federatedId,
    };
  }
}

export const newActorRepository = (repo: Repository<ActorTable>) => {
  return {
    findByUserId: async (userId: string) => {
      const actor = await repo.findOneBy({ userId });
      return actor?.toModel();
    },
    findByUserIds: async (userIds: string[]) => {
      const actors = await repo.findBy({ userId: In(userIds) });
      return actors.map((actor) => actor.toModel());
    },
    save: async (actor: Actor) => {
      const actorTable = ActorTable.fromModel(actor);
      await repo.save(actorTable);
    },
    findAll: async () => {
      const actors = await repo.find();
      return actors.map((actor) => actor.toModel());
    },
    findByFederatedId: async (federatedId: string) => {
      const actor = await repo.findOneBy({ federatedId });
      return actor?.toModel();
    },
  };
};

export type ActorRepository = ReturnType<typeof newActorRepository>;
