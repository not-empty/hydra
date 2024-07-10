import { PoolJob } from '../types';
import handlers from '../handlers/onFinishJob';

export async function onFinishJob<T>(job: PoolJob<T>) {
  if (
    !job.handlers ||
    !job.handlers.onFinishJob
  ) {
    return;
  }

  const handler = handlers[job.handlers.onFinishJob];

  if (!handler) {
    return;
  }

  await handler(job);
}