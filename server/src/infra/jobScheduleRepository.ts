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

  static fromModel(model: JobSchedule): JobScheduleTable {
    const table = new JobScheduleTable();
    table.id = model.id;
    table.name = model.name;
    table.lastExecutedAt = model.lastExecutedAt;
    return table;
  }

  toModel(): JobSchedule {
    return {
      id: this.id,
      name: this.name,
      lastExecutedAt: this.lastExecutedAt,
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
  };
};

export type JobScheduleRepository = ReturnType<typeof newJobScheduleRepository>;
