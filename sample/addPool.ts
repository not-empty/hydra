import redisClient from '../src/services/redisClient';
import { HydraPublisher } from '../src/publisher';

async function main() {
  const numJobs = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const publisher = new HydraPublisher({ redis: redisClient });

  for (let i = 0; i < numJobs; i++) {
    const jobId = await publisher.addJobToPool({ sampleData: `data ${i}` });
    console.log(`added job ${jobId}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
