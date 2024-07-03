import * as Redis from 'redis';
import { REDIS_HOST, REDIS_PORT } from '../config/redis';

const redisClient = Redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisClient.connect();
redisClient.on('error', (err) => {
  console.error('Error connecting to Redis', err);
});

export default redisClient;
