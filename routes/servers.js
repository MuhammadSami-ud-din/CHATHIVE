require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const verifyToken = require('../middleware/authMiddleWare');
const pool = require('../config/db.js');
const router = express.Router();
const mysql2 = require('mysql2/promise');



router.post('/servers',verifyToken , async (req , res)=>{
    const {serverName , serverDescription , serverDest} = req.body;
    if (!serverDescription || !serverDest ||!serverName ){
        return res.status(400).json({error : "All field are required"});
    }

    const owner = req.user.id;
    
    try{
    const [query] =  await pool.query(`INSERT INTO servers (server_name , server_description, server_dest , owner_id )
        VALUES (? ,? ,? , ?)`,[serverName , serverDescription , serverDest , owner]);


       await pool.query(`INSERT INTO server_members ( server_id , members_id , role)
        VALUES (?,?,?)`, [query.insertId, owner , "owner"]); 

        res.status(201).json({
            message : "server created successfully",
            serverId : query.insertId
        })
    }
    catch(error){
        console.log(error);
        if (error.code === "ER_DUP_ENTRY"){
          return res.status(401).json({error : "server already exists"});
        }
        res.status(500).json({error : "database error"});


    }
})


router.get('/servers' , verifyToken , async (req, res )=>{
   try{
    const [servers] = await pool.query ('SELECT * FROM servers');
    
    if(servers.length === 0){
       return res.status(500).json({error : "no servers found"});
    }
    res.status(200).json(servers);

}catch{
    res.status(500).json({error : "cannot Fetch Database error"});
}

})

router.get(`/servers/me` , verifyToken , async (req, res )=>{
    const userId = req.user.id;
   try{
    const [servers] = await pool.query (`SELECT * FROM servers S JOIN server_members SM ON S.server_id = SM.server_id
        WHERE SM.members_id = ? ` , [userId]);
    
    if(servers.length === 0){
       return res.status(500).json({error : "no servers found"});
    }
    res.status(200).json(servers);

}catch{
    res.status(500).json({error : "cannot Fetch Database error"});
}

})


router.get('/servers/:server_id' , verifyToken , async (req, res )=>{
    const {server_id} = req.params;
   try{
    const [channels] = await pool.query ('SELECT * FROM channels WHERE current_server_id = ?' , [server_id]);
    
    if(channels.length === 0){
       return res.status(500).json({error : "no channels found"});
    }
    res.status(200).json(channels);

}catch{
    res.status(500).json({error : "cannot Fetch Database error"});
}

})

module.exports = router;
