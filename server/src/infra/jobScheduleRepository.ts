import { Column, Entity, PrimaryColumn, Repository } from "typeorm";
import { JobSchedule } from "../../../shared/model/jobScheduler";

@Entity()
export class JobScheduleTable {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column()
  lastExecutedAt: number;

  @Column({ nullable: true })
  forceRunFlag: boolean;

  @Column({ nullable: true })
  type: string;

  static fromModel(model: JobSchedule): JobScheduleTable {
    const table = new JobScheduleTable();
    table.id = model.id;
    table.name = model.name;
    table.lastExecutedAt = model.lastExecutedAt;
    table.forceRunFlag = model.forceRunFlag;
    table.type = model.type;
    return table;
  }

  toModel(): JobSchedule {
    return {
      id: this.id,
      name: this.name,
      lastExecutedAt: this.lastExecutedAt,
      forceRunFlag: this.forceRunFlag,
      type: this.type,
    };
  }
}

export const newJobScheduleRepository = (
  repo: Repository<JobScheduleTable>
) => {
  return {
    create: async (model: JobSchedule) => {
      const table = JobScheduleTable.fromModel(model);
      await repo.insert(table);
    },
    save: async (model: JobSchedule) => {
      const table = JobScheduleTable.fromModel(model);
      await repo.save(table);
    },
    findAll: async () => {
      const tables = await repo.find();
      return tables.map((table) => table.toModel());
    },
    findById: async (id: string) => {
      const table = await repo.findOneBy({ id });
      return table?.toModel();
    },
    findByTypeAndName: async (type: string, name: string) => {
      const table = await repo.findOneBy({ type, name });
      return table?.toModel();
    },
  };
};

export type JobScheduleRepository = ReturnType<typeof newJobScheduleRepository>;
