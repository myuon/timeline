import { Column, Entity, PrimaryColumn, Repository } from "typeorm";
import { FollowRelation } from "@/shared/model/follow";

@Entity()
export class FollowRelationTable {
  @PrimaryColumn()
  userUrl: string;

  @PrimaryColumn()
  targetUserUrl: string;

  @Column()
  createdAt: number;

  static fromModel(followRelation: FollowRelation): FollowRelationTable {
    const record = new FollowRelationTable();
    record.userUrl = followRelation.userUrl;
    record.targetUserUrl = followRelation.targetUserUrl;
    record.createdAt = followRelation.createdAt;
    return record;
  }

  toModel(): FollowRelation {
    return {
      userUrl: this.userUrl,
      targetUserUrl: this.targetUserUrl,
      createdAt: this.createdAt,
    };
  }
}

export const newFollowRelationRepository = (
  repo: Repository<FollowRelationTable>
) => {
  return {
    async create(followRelation: FollowRelation) {
      const record = FollowRelationTable.fromModel(followRelation);
      return repo.create(record);
    },
    async findFollowersCount(userId: string) {
      const count = await repo.countBy({ userUrl: userId });
      return count;
    },
    async findFollowers(userUrl: string) {
      const records = await repo.findBy({ userUrl });
      const followRelations = records.map((record) => record.toModel());
      return followRelations;
    },
  };
};
export type FollowRelationRepository = ReturnType<
  typeof newFollowRelationRepository
>;
