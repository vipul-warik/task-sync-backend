import Redis from "ioredis";

//Determine the URL based on environment
// Override the env variables if necessary while running in Docker
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

redis.on('connect', () => console.log("Redis Connected"));
redis.on('error', (err) => console.log('Redis Error: ', err));

export default redis;

