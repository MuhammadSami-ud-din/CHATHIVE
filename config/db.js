require('dotenv').config();
const mysql = require('mysql2');



const pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    password : process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    user : process.env.DB_USER

})

module.exports = pool.promise();





