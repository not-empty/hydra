import { HydraPublisher } from '../src/publisher';
import redisClient from '../src/services/redisClient';

async function main() {
  const jobId = process.argv[2];
  if (jobId) {
    const publisher = new HydraPublisher({ redis: redisClient });

    await publisher.finishJob(jobId);
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
