import Redis from 'redis';

const redisClient = Redis.createClient({
  host: 'localhost',
  port: 6379,
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis', err);
});

export default redisClient;
