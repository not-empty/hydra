import { HydraPublisher } from '../src/publisher';
import redisClient from '../src/services/redisClient';

async function main() {
  const jobId = process.argv[2];
  if (jobId) {
    const publisher = new HydraPublisher({ prefix: 'hydra_analyse', redis: redisClient });

    await publisher.sendToPending(jobId);
    process.exit(0);
  } else {
    console.error('Please provide a jobId to send to pending');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
