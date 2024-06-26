import redisClient from './redisClient.js';

async function finishJob(jobId: string) {
  console.log(`Finishing job ${jobId}`);
  await new Promise<void>((resolve, reject) => {
    redisClient.del(`analysis:${jobId}`, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  await new Promise<void>((resolve, reject) => {
    redisClient.srem('executing_analysis_set', jobId, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  await new Promise<void>((resolve, reject) => {
    redisClient.srem('analysis_set', jobId, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  redisClient.publish('job_update', 'finished');
  console.log(`Job ${jobId} removed from executing list`);
}

async function main() {
  const jobId = process.argv[2];
  if (jobId) {
    await finishJob(jobId);
    process.exit(0);
  } else {
    console.error('Please provide a jobId to finish');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
