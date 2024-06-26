import redisClient from './redisClient.js';
import { ulid } from 'ulid';
import { AnalysisJob } from './types.js';

async function addJobToPool(data: any): Promise<string> {
  const job: AnalysisJob = {
    id: ulid(),
    data
  };

  return new Promise<string>((resolve, reject) => {
    redisClient.lpush('pending_analysis_queue', JSON.stringify(job), (err) => {
      if (err) reject(err);
      resolve(job.id);
    });
  });
}

async function main() {
  const numJobs = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  for (let i = 0; i < numJobs; i++) {
    const jobId = await addJobToPool({ sampleData: `data ${i}` });
    console.log(`node finishPoo.js ${jobId} && \\`);
    redisClient.publish('job_update', 'added');
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
