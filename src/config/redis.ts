import 'dotenv/config';

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

