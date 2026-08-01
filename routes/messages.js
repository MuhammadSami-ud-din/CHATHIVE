require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const message = require('../models/message.js');
const verifyToken = require('../middleware/authMiddleWare.js');
const router = express.Router();


router.post ('/channels/:channel_id/messages' , verifyToken , async (req , res)=>{
    const {channel_id} = req.params;
    const {message_content} = req.body;
    const userId = req.user.id;
    let isMember = true;
    try {
    const [id] = await pool.query(`SELECT current_server_id FROM channels WHERE channel_id = ? `, [channel_id]);

    if (id.length === 0){
        return res.status(500).json({error : "Database error"});
    }

    const server_id = id[0].current_server_id;
try{
    const [is_member] = await pool.query(`SELECT server_id FROM server_members WHERE server_id = ?  AND members_id = ? `, [server_id , userId]);

    if(is_member.length === 0 ){
        isMember = false;
        return res.status(500).json({error : "U are not a part of this server so U Can't send messages"});
    }
}catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}

} catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}

    if (isMember){
      try{
        const newMessage = await message.create({
            channel_id ,
            sender_id : userId,
            content : message_content
        })

        res.status(201).json({
            message : "Message sent successfully",
            data : newMessage
        })
      }
     catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}
    }



})

module.exports = router;