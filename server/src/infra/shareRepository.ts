import { Column, Entity, PrimaryColumn, Repository } from "typeorm";
import { Share } from "../../../shared/model/share";

@Entity()
export class ShareTable {
  @PrimaryColumn({ length: 100 })
  userId: string;

  @PrimaryColumn({ length: 100 })
  noteId: string;

  @Column()
  createdAt: number;

  static fromModel(share: Share): ShareTable {
    const shareTable = new ShareTable();
    shareTable.userId = share.userId;
    shareTable.noteId = share.noteId;
    shareTable.createdAt = share.createdAt;
    return shareTable;
  }

  toModel(): Share {
    return {
      userId: this.userId,
      noteId: this.noteId,
      createdAt: this.createdAt,
    };
  }
}

export const newShareRepository = (repo: Repository<ShareTable>) => {
  return {
    findByUserId: async (userId: string) => {
      const shares = await repo.findBy({ userId });
      return shares.map((share) => share.toModel());
    },
    findByNoteId: async (noteId: string) => {
      const shares = await repo.findBy({ noteId });
      return shares.map((share) => share.toModel());
    },
    findByUserIdAndNoteId: async (userId: string, noteId: string) => {
      const share = await repo.findOneBy({ userId, noteId });
      return share?.toModel();
    },
    create: async (share: Share) => {
      const shareTable = ShareTable.fromModel(share);
      await repo.save(shareTable);
    },
  };
};

export type ShareRepository = ReturnType<typeof newShareRepository>;
