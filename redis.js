require ('dotenv').config();
const Redis = require('ioredis')

const redis = new Redis(process.env.REDIS_URL)

redis.on('connect' , ()=> console.log('redis connected'))

redis.on('error' ,  (err)=> console.log('Error occured:' , err.message))

module.exports = redis;