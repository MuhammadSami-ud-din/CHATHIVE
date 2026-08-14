require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const verifyToken = require('../middleware/authMiddleWare');
const router = express.Router();


router.post('/channels/:server_id' , verifyToken , async(req , res)=>{
    
   try{
    const {server_id} = req.params;
    const memberId = Number( req.user.id ) ;
    console.log(memberId);
    const [info] = await pool.query(`SELECT role FROM server_members WHERE members_id=? AND server_id = ?` , [memberId , server_id]);
    if (!info.length ){
        console.log({info});
        return res.status(500).json({error : "Databaseeeerror"});
    }
    const isAuthorized = info[0].role === 'owner' || info[0].role === 'admin' ? true : false;

    if(isAuthorized){
        const {channel_name  , channel_description } = req.body;

    if ( !channel_name  || !channel_description ){
        return res.status(401).json({error : "all fields are required"});
    }

    

try{
    const [query] = await  pool.query(`INSERT INTO channels ( channel_name  , channel_description , current_server_id ) 
        VALUES(?,?,?)` , [ channel_name  , channel_description , server_id]);


         res.status(201).json({
            message: "Channel created successfully",
            channel_id : query.insertId
        });

    }
    catch(error) {
        console.log(error)
      if (error.code === "ER_DUP_ENTRY"){
          return res.status(401).json({error : "Channel already exists"});
        }
        res.status(500).json({error: "Database error"});
    }
    }
    else {
       res.status(401).json({error : "U are not authorized to create a channel"})
    }
    
    }
   catch(error) {
        console.log(error);
    return res.status(500).json({error : "Database error"}); }

})


router.get('/channels/:server_id', verifyToken , async(req,res)=>{
    const { server_id } = req.params;

    try{
        const [query] = await pool.query(`SELECT * FROM channels where current_server_id = ?` , [server_id]);
        
        if(query.length === 0){
            return res.status(200).json({message : "No channels found" ,  data : []});
        }

        res.status(201).json(query);
    }
    catch{
        res.status(500).json({error : "Database error"})
    }
})


module.exports = router;