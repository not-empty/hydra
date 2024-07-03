import 'dotenv/config';

export const POOL_PREFIX: string = process.env.POOL_PREFIX || 'hydra';

export const POOL_PENDING: string = `${POOL_PREFIX}_pending`;
export const POOL_INITIALIZED: string = `${POOL_PREFIX}_initialized`;
export const POOL_EXECUTING: string = `${POOL_PREFIX}_executing`;

export const POOL_JOB: string = `${POOL_PREFIX}_job`;

export const POOL_MAX_CONCURRENT = process.env.POOL_MAX_CONCURRENT ? parseInt(process.env.POOL_MAX_CONCURRENT, 10) : 10;
export const POOL_INTERVAL = process.env.POOL_INTERVAL ? parseInt(process.env.POOL_INTERVAL, 10) : 100;

export const JOB_UPDATE_EVENT: string = `${POOL_PREFIX}_job_update`;
export enum JobUpdateEvent {
  STARTED='STARTED',
  FINISHED='FINISHED',
  ADDED='ADDED',
}

