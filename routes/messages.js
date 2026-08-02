require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const message = require('../models/message.js');
const verifyToken = require('../middleware/authMiddleWare.js');
const router = express.Router();



async function verifyUser (channel_id , userId){
     const [id] = await pool.query(`SELECT sm.members_id FROM server_members sm
    JOIN channels ch ON ch.current_server_id = sm.server_id
    WHERE ch.channel_id = ?
    AND sm.members_id = ? `, [channel_id , userId]);


    return id.length > 0;
}

router.post ('/channels/:channel_id/messages' , verifyToken , async (req , res)=>{
    const {channel_id} = req.params;
    const {message_content} = req.body;
    const userId = req.user.id;
    


    try {
    const isMember = await verifyUser(channel_id , userId);

    if (!isMember){
        return res.status(403).json({error : "U are not a Part of this server , U cant send messages"});
    }



} catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}

   
      try{
        const newMessage = await message.create({
            channel_id ,
            sender_id : userId,
            content : message_content
        })

  const io = req.app.get('io');
  console.log(`channel_${channel_id}` , newMessage)
io.to(`channel_${channel_id}`).emit('newMessage', newMessage);

        res.status(201).json({
            message : "Message sent successfully",
            data : newMessage
        })
      }
     catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}
    



})


router.get ('/channels/:channel_id/messages' , verifyToken , async (req , res)=>{
    const {channel_id} = req.params;
    const userId = req.user.id;
try{
    const isMember = await verifyUser(channel_id , userId);

    if (!isMember){
        return res.status(403).json({error : "U are not a member and cant see messages"});
    }
}catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}

try {
    const channelMessages = await message.find({channel_id})
    res.status(201).json({
        success : true,
        data : channelMessages
    })
}
catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}




})












module.exports = router;








