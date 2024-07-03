import { JOB_UPDATE_EVENT, JobUpdateEvent, POOL_EXECUTING, POOL_INITIALIZED, POOL_JOB, POOL_PENDING } from "./config/pool";
import redisClient from "./services/redisClient";
import { PoolJob } from "./types";

export async function addInitializedJob(jobId: string): Promise<void> {
  await redisClient.sAdd(POOL_INITIALIZED, jobId);
}

export async function getInitializedJobs(): Promise<string[]> {
  return redisClient.sMembers(POOL_INITIALIZED);
}

export async function removeInitializedJob(jobId: string): Promise<void> {
  await redisClient.sRem(POOL_INITIALIZED, jobId);
}

export async function isJobExecuting(jobId: string): Promise<boolean> {
  return redisClient.sIsMember(POOL_EXECUTING, jobId);
}

export async function countExecutingJobs(): Promise<number> {
  return redisClient.sCard(POOL_EXECUTING);
}

export async function addExecutingJob(jobId: string): Promise<void> {
  await redisClient.sAdd(POOL_EXECUTING, jobId);
}

export async function countPendingJobs(): Promise<number> {
  return redisClient.lLen(POOL_PENDING);
}

export async function popPendingJob<T>(): Promise<PoolJob<T> | null> {
  const job = await redisClient.rPop(POOL_PENDING);

  if (!job) {
    return null;
  }

  return JSON.parse(job) as PoolJob<T>;
}

export async function setJob<T>(job: PoolJob<T>): Promise<void> {
  await redisClient.set(`${POOL_JOB}:${job.id}`, JSON.stringify(job));
}

export async function getJob<T>(jobId: string): Promise<PoolJob<T> | null> {
  const job = await redisClient.get(`${POOL_JOB}:${jobId}`);

  if (!job) {
    return null;
  }

  return JSON.parse(job) as PoolJob<T>;
}

export async function delJob(jobId: string): Promise<void> {
  await redisClient.del(`${POOL_JOB}:${jobId}`);
}

export async function sendJobUpdateEvent(event: JobUpdateEvent): Promise<void> {
  await redisClient.publish(JOB_UPDATE_EVENT, event);
}
