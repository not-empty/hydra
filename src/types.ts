export interface PoolJob<T> {
  id: string;
  handlers?: HydraHandlers;
  data: T;
}

export interface HydraHandlers {
  onStartJob?: string;
  onFinishJob?: string;
}

export type HydraHandler<T> = (job: PoolJob<T>) => Promise<void>;

export enum JobUpdateEventType {
  STARTED='STARTED',
  FINISHED='FINISHED',
  ADDED='ADDED',
}

export interface JobUpdateEvent {
  type: JobUpdateEventType;
  jobId: string;
}