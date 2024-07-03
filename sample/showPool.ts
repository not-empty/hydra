import { HydraPublisher } from '../src/publisher';
import redisClient from '../src/services/redisClient';

async function main() {
  const publisher = new HydraPublisher({ redis: redisClient });

  const pool = await publisher.showPool();

  console.log(`executing ${pool.executing.length}\n${pool.executing.join('\n')}\n`);
  console.log(`initialized ${pool.initialized.length}\n${pool.initialized.join('\n')}\n`);
  console.log(`pending ${pool.pending.length}\n${pool.pending.join('\n')}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
