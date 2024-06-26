import redisClient from './redisClient.js';
import { AnalysisJob } from './types.js';

const MAX_CONCURRENT_ANALYSES = 10;
const POLL_INTERVAL = 100;
let isIdle = false;
let isWaitingForSlots = false;

async function startAnalysis(job: AnalysisJob) {
  console.log(`Starting analysis for job ${job.id}`);

  await new Promise<void>((resolve, reject) => {
    redisClient.sadd('executing_analysis_set', job.id, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  await new Promise<void>((resolve, reject) => {
    redisClient.set(`analysis:${job.id}`, JSON.stringify(job), (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  await new Promise<void>((resolve, reject) => {
    redisClient.sadd('analysis_set', job.id, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
  

  redisClient.publish('job_update', 'started');
}

async function checkAnalysisStatus() {
  const jobIds = await new Promise<string[]>((resolve, reject) => {
    redisClient.smembers('analysis_set', (err, jobIds) => {
      if (err) reject(err);
      resolve(jobIds);
    });
  });

  let jobFinished = false;

  for (const jobId of jobIds) {
    const job = await new Promise<AnalysisJob | null>((resolve, reject) => {
      redisClient.get(`analysis:${jobId}`, (err, result) => {
        if (err) reject(err);
        resolve(result ? JSON.parse(result) as AnalysisJob : null);
      });
    });

    if (job) {
      const isExecuting = await new Promise<boolean>((resolve, reject) => {
        redisClient.sismember('executing_analysis_set', job.id, (err, result) => {
          if (err) reject(err);
          resolve(result === 1);
        });
      });

      if (!isExecuting) {
        console.log(`Job ${job.id} is no longer executing`);
        await new Promise<void>((resolve, reject) => {
          redisClient.del(`analysis:${job.id}`, (err) => {
            if (err) reject(err);
            resolve();
          });
        });
        await new Promise<void>((resolve, reject) => {
          redisClient.srem('analysis_set', job.id, (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        jobFinished = true;
      }
    }
  }

  // Update state and log message when a job finishes
  if (jobFinished) {
    await updateStateAndLog();
  }
}

async function processNextJob() {
  const executingCount = await new Promise<number>((resolve, reject) => {
    redisClient.scard('executing_analysis_set', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  const pendingCount = await new Promise<number>((resolve, reject) => {
    redisClient.llen('pending_analysis_queue', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  if (executingCount < MAX_CONCURRENT_ANALYSES) {
    if (pendingCount > 0) {
      isIdle = false;
      isWaitingForSlots = false;
      console.log(`Slot available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
      const job = await new Promise<string | null>((resolve, reject) => {
        redisClient.rpop('pending_analysis_queue', (err, job) => {
          if (err) reject(err);
          resolve(job);
        });
      });

      if (job) {
        const parsedJob = JSON.parse(job) as AnalysisJob;
        await startAnalysis(parsedJob);
      }
    } else if (!isIdle) {
      isIdle = true;
      isWaitingForSlots = false;
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }
  } else if (pendingCount > 0 && !isWaitingForSlots) {
    isWaitingForSlots = true;
    isIdle = false;
    console.log(`Waiting for slots to become available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
  } else if (pendingCount === 0 && !isIdle) {
    isIdle = true;
    isWaitingForSlots = false;
    console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
  }
}

async function updateStateAndLog() {
  const executingCount = await new Promise<number>((resolve, reject) => {
    redisClient.scard('executing_analysis_set', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  const pendingCount = await new Promise<number>((resolve, reject) => {
    redisClient.llen('pending_analysis_queue', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  if (executingCount < MAX_CONCURRENT_ANALYSES && pendingCount === 0) {
    if (!isIdle) {
      isIdle = true;
      isWaitingForSlots = false;
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    } else {
      console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }
  } else if (executingCount < MAX_CONCURRENT_ANALYSES && pendingCount > 0) {
    if (isIdle || isWaitingForSlots) {
      isIdle = false;
      isWaitingForSlots = false;
      console.log(`Slot available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }
  } else if (executingCount === MAX_CONCURRENT_ANALYSES && pendingCount > 0) {
    if (!isWaitingForSlots) {
      isWaitingForSlots = true;
      isIdle = false;
      console.log(`Waiting for slots to become available. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
    }
  } else if (isIdle) {
    console.log(`Idle: No more jobs to execute. Current executing jobs: ${executingCount}, Pending jobs in queue: ${pendingCount}`);
  }
}

async function manageAnalyses() {
  // Log the initial number of running jobs and pending jobs in the queue
  const initialExecutingCount = await new Promise<number>((resolve, reject) => {
    redisClient.scard('executing_analysis_set', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  const initialPendingCount = await new Promise<number>((resolve, reject) => {
    redisClient.llen('pending_analysis_queue', (err, count) => {
      if (err) reject(err);
      resolve(count);
    });
  });

  console.log(`Starting. Current executing jobs: ${initialExecutingCount}, Pending jobs in queue: ${initialPendingCount}`);

  // Subscribe to job updates
  const subscriber = redisClient.duplicate();
  subscriber.subscribe('job_update');
  subscriber.on('message', (channel, message) => {
    if (channel === 'job_update') {
      updateStateAndLog();
    }
  });

  // Trigger an initial state check
  setInterval(async () => {
    try {
      await checkAnalysisStatus();
      await processNextJob();
    } catch (err) {
      console.error('Error during interval execution:', err);
    }
  }, POLL_INTERVAL);
}

manageAnalyses().catch(console.error);
