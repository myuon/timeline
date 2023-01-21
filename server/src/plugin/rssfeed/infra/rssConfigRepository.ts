import { Column, Entity, PrimaryColumn, Repository } from "typeorm";
import { RssConfig } from "../model/rssConfig";

@Entity()
export class RssConfigTable {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column()
  title: string;

  @Column()
  url: string;

  @Column()
  createdAt: number;

  static fromModel(model: RssConfig) {
    const table = new RssConfigTable();
    table.id = model.id;
    table.title = model.title;
    table.url = model.url;
    table.createdAt = model.createdAt;

    return table;
  }

  toModel(): RssConfig {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      createdAt: this.createdAt,
    };
  }
}

export const newRssConfigRepository = (
  repository: Repository<RssConfigTable>
) => {
  return {
    create: async (model: RssConfig) => {
      const table = RssConfigTable.fromModel(model);
      await repository.save(table);
    },
    delete: async (id: string) => {
      await repository.delete(id);
    },
    findAll: async () => {
      const tables = await repository.find({
        order: {
          createdAt: "DESC",
        },
      });
      return tables.map((table) => table.toModel());
    },
  };
};

export type RssConfigRepository = ReturnType<typeof newRssConfigRepository>;
