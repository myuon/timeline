export interface JobSchedule {
  id: string;
  name: string;
  lastExecutedAt: number;
  forceRunFlag: boolean;
  type: string;
}
