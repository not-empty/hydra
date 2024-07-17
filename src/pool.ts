import * as pool from './core';
import { POOL_INTERVAL, POOL_MAX_CONCURRENT, JOB_UPDATE_EVENT } from './config/pool';
import { JobUpdateEvent, JobUpdateEventType, PoolJob } from './types';
import redisClient from './services/redisClient';
import { onStartJob, onFinishJob } from './events';

let isIdle = false;
let isWaitingForSlots = false;

async function startJob<T>(job: PoolJob<T>) {
  console.log(`Starting job ${job.id}`);

  await pool.addExecutingJob(job.id);
  await pool.setJob(job);
  await pool.addInitializedJob(job.id);

  await onStartJob(job);
  await pool.sendJobUpdateEvent(JobUpdateEventType.STARTED, job.id);
}

async function checkPoolStatus() {
  const jobIds = await pool.getInitializedJobs();

  let jobFinished = false;

  for (const jobId of jobIds) {
    const job = await pool.getJob(jobId)

    if (!job) {
      continue;
    }

    const isExecuting = await pool.isJobExecuting(job.id);

    if (!isExecuting) {
      console.log(`Job ${job.id} is no longer executing`);

      await pool.delJob(job.id);
      await pool.removeInitializedJob(job.id);

      jobFinished = true;
    }
  }

  // Update state and log message when a job finishes
  if (jobFinished) {
    await updateStateAndLog();
  }
}

async function processNextJob() {
  const executingCount = await pool.countExecutingJobs();
  const pendingCount = await pool.countPendingJobs();

  if (executingCount < POOL_MAX_CONCURRENT) {
    if (pendingCount > 0) {
      isIdle = false;
      isWaitingForSlots = false;
      console.log(`Slot available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
      const job = await pool.popPendingJob();

      if (job) {
        await startJob(job);
      }

      return;
    }

    if (!isIdle) {
      isIdle = true;
      isWaitingForSlots = false;
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }

    return;
  }

  if (pendingCount > 0 && !isWaitingForSlots) {
    isWaitingForSlots = true;
    isIdle = false;
    console.log(`Waiting for slots to become available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    return;
  }

  if (pendingCount === 0 && !isIdle) {
    isIdle = true;
    isWaitingForSlots = false;
    console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    return;
  }
}

async function updateStateAndLog() {
  const executingCount = await pool.countExecutingJobs();
  const pendingCount = await pool.countPendingJobs();

  if (executingCount < POOL_MAX_CONCURRENT && pendingCount === 0) {
    if (!isIdle) {
      isIdle = true;
      isWaitingForSlots = false;
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    } else {
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }

    return;
  }
  
  if (executingCount < POOL_MAX_CONCURRENT && pendingCount > 0) {
    if (isIdle || isWaitingForSlots) {
      isIdle = false;
      isWaitingForSlots = false;
      console.log(`Slot available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }

    return;
  }
  
  if (executingCount === POOL_MAX_CONCURRENT && pendingCount > 0) {
    if (!isWaitingForSlots) {
      isWaitingForSlots = true;
      isIdle = false;
      console.log(`Waiting for slots to become available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }

    return;
  }

  if (isIdle) {
    console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
  }
}

async function handlerJobUpdateEvent(event: string) {
  const jobUpdateEvent = JSON.parse(event) as JobUpdateEvent;

  if (jobUpdateEvent.type === JobUpdateEventType.FINISHED) {
    const job = await pool.getJob(jobUpdateEvent.jobId);
    if (!job) {
      return;
    }

    onFinishJob(job);
  }
}

async function startPool() {
  // Log the initial number of running jobs and pending jobs in the queue
  const initialExecutingCount = await pool.countExecutingJobs();
  const initialPendingCount = await pool.countPendingJobs();

  console.log(`Starting. Current executing jobs: ${initialExecutingCount}, Pending jobs in queue: ${initialPendingCount}`);

  // Subscribe to job updates
  const subscriber = redisClient.duplicate();
  subscriber.subscribe(JOB_UPDATE_EVENT, (message, channel) => {
    if (channel === JOB_UPDATE_EVENT) {
      handlerJobUpdateEvent(message)
        .finally(() => {
          updateStateAndLog();
        });
    }
  });

  // Trigger an initial state check
  setInterval(async () => {
    try {
      await checkPoolStatus();
      await processNextJob();
    } catch (err) {
      console.error('Error during interval execution:', err);
    }
  }, POOL_INTERVAL);
}

startPool().catch(console.error);
