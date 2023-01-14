import { Column, Entity, In, PrimaryColumn, Repository } from "typeorm";
import { Actor } from "../../../shared/model/actor";

@Entity()
export class ActorTable {
  @PrimaryColumn({ length: 100 })
  userId: string;

  @Column({ nullable: true })
  rawData?: string;

  @Column({ nullable: true })
  inboxUrl?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  summary?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  publicKeyPem?: string;

  @Column({ nullable: true })
  iconUrl?: string;

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
    };
  }
}

export const newActorRepository = (repo: Repository<ActorTable>) => {
  return {
    findByUserId: async (federatedId: string) => {
      const actor = await repo.findOneBy({ userId: federatedId });
      return actor?.toModel();
    },
    findByUserIds: async (federatedIds: string[]) => {
      const actors = await repo.findBy({ userId: In(federatedIds) });
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
    findByUrl: async (url: string) => {
      const actor = await repo.findOneBy({ url });
      return actor?.toModel();
    },
  };
};

export type ActorRepository = ReturnType<typeof newActorRepository>;
