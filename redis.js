require('dotenv').config();
const Redis = require('ioredis');


const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        return 10000; 
    }
});

redis.on('connect', () => console.log('🚀 Redis connected successfully!'));
redis.on('error', (err) => {
    console.error('🛑 REDIS CONNECTION ERROR:', err.message);
});

module.exports = redis;
