import { PoolJob } from '../types';
import handlers from '../handlers/onStartJob';

export async function onStartJob<T>(job: PoolJob<T>) {
  if (
    !job.handlers ||
    !job.handlers.onStartJob
  ) {
    return;
  }

  const handler = handlers[job.handlers.onStartJob];

  if (!handler) {
    return;
  }

  await handler(job);
}