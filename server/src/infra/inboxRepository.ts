import { Column, Entity, PrimaryColumn, Repository, Unique } from "typeorm";
import { InboxItem } from "@/shared/model/inbox";

@Entity()
@Unique(["type", "itemId"])
export class InboxItemTable {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  createdAt: number;

  @Column()
  type: string;

  @Column()
  itemId: string;

  static fromModel(model: InboxItem): InboxItemTable {
    const table = new InboxItemTable();
    table.id = model.id;
    table.userId = model.userId;
    table.createdAt = model.createdAt;
    table.type = model.type;
    table.itemId = model.itemId;
    return table;
  }

  toModel(): InboxItem {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      type: this.type,
      itemId: this.itemId,
    };
  }
}

export const newInboxItemRepository = (repo: Repository<InboxItemTable>) => {
  return {
    async create(item: InboxItem) {
      const table = InboxItemTable.fromModel(item);
      await repo.save(table);
    },
    async findTimelineItems(
      userId: string,
      condition: {
        page: number;
        perPage: number;
        since?: number;
        type?: string;
      }
    ) {
      const query = repo
        .createQueryBuilder("inbox")
        .where("inbox.userId = :userId", { userId })
        .orderBy("inbox.createdAt", "DESC")
        .skip(condition.page * condition.perPage)
        .take(condition.perPage);
      if (condition.since) {
        query.andWhere("inbox.createdAt > :since", { since: condition.since });
      }
      if (condition.type) {
        query.andWhere("inbox.type = :type", { type: condition.type });
      }
      const items = await query.getMany();
      return items.map((item) => item.toModel());
    },
  };
};

export type InboxItemRepository = ReturnType<typeof newInboxItemRepository>;
