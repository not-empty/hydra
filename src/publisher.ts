import Redis, { RedisClientOptions, RedisClientType, RedisModules } from 'redis';
import { ulid } from 'ulid';
import { PoolJob } from './types';
import { JobUpdateEvent } from './config/pool';

type RedisClientGeneric = RedisClientType<any, any, any>;
type RedisOptionsGeneric = RedisClientOptions<any, any, any>;

interface PoolList {
  initialized: string[];
  executing: string[];
  pending: string[];
}

interface PoolKeys {
  POOL_PENDING: string;
  POOL_INITIALIZED: string;
  POOL_EXECUTING: string;
  POOL_JOB: string;
  JOB_UPDATE_EVENT: string;
}


interface HydraPublisherOptions<R extends RedisClientGeneric, O extends RedisOptionsGeneric> {
  redis?: R,
  redisOptions?: O,
  prefix?: string
}

export function getRedisClient<R extends RedisClientGeneric, O extends RedisOptionsGeneric>(options: HydraPublisherOptions<R, O>) {
  if (options.redis) {
    return options.redis;
  }

  return Redis.createClient(options.redisOptions) as R;
}

export class HydraPublisher<R extends RedisClientGeneric, O extends RedisOptionsGeneric> {

  private redisClient: R;

  private prefix: string;

  private keys: PoolKeys;

  constructor(options: HydraPublisherOptions<R, O>) {
    this.redisClient = getRedisClient<R, O>(options);
    this.prefix = options.prefix || 'hydra';
    this.keys = {
      POOL_PENDING: `${this.prefix}_pending`,
      POOL_INITIALIZED: `${this.prefix}_initialized`,
      POOL_EXECUTING: `${this.prefix}_executing`,
      POOL_JOB: `${this.prefix}_job`,
      JOB_UPDATE_EVENT: `${this.prefix}_job_update`,
    };

  }

  public async addJobToPool<T>(data: T): Promise<string> {
    const job: PoolJob<T> = {
      id: ulid(),
      data
    };

    await this.redisClient.lPush(this.keys.POOL_PENDING, JSON.stringify(job));
    await this.redisClient.publish(this.keys.JOB_UPDATE_EVENT, JobUpdateEvent.ADDED);
    return job.id;
  }

  public async finishJob(jobId: string) {
    console.log(`Finishing job ${jobId}`);
    await this.redisClient.del(`${this.keys.POOL_JOB}:${jobId}`);
    await this.redisClient.sRem(this.keys.POOL_EXECUTING, jobId);
    await this.redisClient.sRem(this.keys.POOL_INITIALIZED, jobId);
    await this.redisClient.publish(this.keys.JOB_UPDATE_EVENT, JobUpdateEvent.FINISHED);

    console.log(`Job ${jobId} removed from executing list`);
  }

  public async showPool(): Promise<PoolList> {
    const executing = await this.redisClient.sMembers(this.keys.POOL_EXECUTING);
    const initialized = await this.redisClient.sMembers(this.keys.POOL_INITIALIZED);
    const pending = await this.redisClient.lRange(this.keys.POOL_PENDING, 0, -1);

    return {
      initialized,
      executing,
      pending
    };
  }

}