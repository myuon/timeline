import { Column, Entity, PrimaryColumn, Repository, Unique } from "typeorm";
import { Actor } from "@/shared/model/actor";

@Entity()
@Unique(["federatedId"])
export class ActorTable {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column()
  federatedId: string;

  @Column()
  rawData: string;

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
    actorTable.id = actor.id;
    actorTable.federatedId = actor.federatedId;
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
      id: this.id,
      federatedId: this.federatedId,
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
    findById: async (id: string) => {
      const actor = await repo.findOneBy({ id });
      return actor?.toModel();
    },
    findByFederatedId: async (federatedId: string) => {
      const actor = await repo.findOneBy({ federatedId });
      return actor?.toModel();
    },
    save: async (actor: Actor) => {
      const actorTable = ActorTable.fromModel(actor);
      await repo.insert(actorTable);
    },
  };
};

export type ActorRepository = ReturnType<typeof newActorRepository>;
