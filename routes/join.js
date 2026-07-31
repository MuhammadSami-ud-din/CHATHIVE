require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const verifyToken = require('../middleware/authMiddleWare');
const router = express.Router();


router.post('/server_join/:serverId' , verifyToken , async (req , res)=>{
const {serverId} = req.params;
const userId = Number(req.user.id);




try{
const [memberId] = await pool.query(`INSERT INTO server_members (server_id , members_id)
    VALUES (?,?)` , [serverId , userId]);



     return res.status(201).json({
        message : "U are now a member of this server",
        memberId : memberId.insertId
    });
}
catch(error){
    console.log(error);
   if (error.code === "ER_DUP_ENTRY"){
    return res.status(401).json({error : "U are already a member"});
   }
    return res.status(500).json({error : "Database error"});
}



})

module.exports = router;