require ('dotenv').config();
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL)

redis.on('connect ' , ()=> console.log('redis connected'))

redis.on('error' ,  (err)=> console.log('Error occured:' , err.message))