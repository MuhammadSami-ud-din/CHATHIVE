const mysql = require('mysql2');

require('dotenv').config();

const pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    password : process.env.DB_PASSWORD,
   
    user : process.env.DB_USER

})

module.exports = pool.promise();





