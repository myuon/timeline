import { Column, Entity, PrimaryColumn, Repository } from "typeorm";
import { FollowRelation } from "@/shared/model/follow";

@Entity()
export class FollowRelationTable {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  targetUserId: string;

  @Column()
  createdAt: number;

  static fromModel(followRelation: FollowRelation): FollowRelationTable {
    const record = new FollowRelationTable();
    record.userId = followRelation.userId;
    record.targetUserId = followRelation.targetUserId;
    record.createdAt = followRelation.createdAt;
    return record;
  }

  toModel(): FollowRelation {
    return {
      userId: this.userId,
      targetUserId: this.targetUserId,
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
      return repo.insert(record);
    },
    async save(followRelation: FollowRelation) {
      const record = FollowRelationTable.fromModel(followRelation);
      return repo.save(record);
    },
    async findFollowersCount(targetUserId: string) {
      const count = await repo.countBy({ targetUserId });
      return count;
    },
    async findFollowers(targetUserId: string) {
      const records = await repo.findBy({ targetUserId });
      const followRelations = records.map((record) => record.toModel());
      return followRelations;
    },
  };
};
export type FollowRelationRepository = ReturnType<
  typeof newFollowRelationRepository
>;
