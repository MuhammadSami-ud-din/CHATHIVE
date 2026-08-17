require('dotenv').config();
const jwt = require ('jsonwebtoken');
const express = require('express');
const  pool  = require('../config/db');
const router = express.Router();
const secret = process.env.JWT_SECRET;


async function verifyToken(req , res ,  next){
    const authenticationHeader = req.headers['authorization'] ;
    const token = authenticationHeader && authenticationHeader.split(' ')[1];

    if (!token){
       return res.status(401).json({error : "Token not provided"});
    }
try{
    const decoded = jwt.verify(token , secret);

    const [userInfo] = await pool.query(`SELECT username , id , email , avatar , created_at FROM USERS WHERE id = ? ` , [decoded.id])

    if(userInfo.length === 0){
         return res.status(404).json({ error: "user not found" });
    }
     
        req.user = userInfo[0];
        next();

}catch{
    return res.status(401).json({ error: "Invalid token" });
}

}

module.exports = verifyToken;
