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

function parseChannelId(rawId) {
    const num = Number(rawId);
    return isNaN(num) ? rawId : num;
}

router.post ('/channels/:channel_id/messages' , verifyToken , async (req , res)=>{
    const rawChannelId = req.params.channel_id;
    const cleanChannelId = parseChannelId(rawChannelId);
    const {msg_content} = req.body;
    const userId = req.user.id;
    

     if (!msg_content || !msg_content.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty" });
    }


    try {
       
    const isMember = await verifyUser(cleanChannelId , userId);

    if (!isMember){
        return res.status(403).json({error : "U are not a Part of this server , U cant send messages"});
    }





   
    
        const newMessage = await message.create({
            channel_id: cleanChannelId ,
            sender_id : userId,
            content : msg_content
        });

      

        const HydrateMessages = {
            ...newMessage.toObject(),
            sender : {
                id : userId , 
                username : req.user.username,
                avatar : req.user.avatar,
                email : req.user.email,
                created_at : req.user.created_at
            }
        }

  const io = req.app.get('io');
  console.log(`channel_${cleanChannelId}` , HydrateMessages)
io.to(`channel_${cleanChannelId}`).emit('newMessage', HydrateMessages);

        res.status(201).json({
            message : "Message sent successfully",
            data : HydrateMessages
        })
      }
     catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}
    



})


router.get ('/channels/:channel_id/messages' , verifyToken , async (req , res)=>{
    const rawChannelId = req.params.channel_id;
    const cleanChannelId = parseChannelId(rawChannelId);
    const userId = req.user.id;
try{
    const isMember = await verifyUser(cleanChannelId , userId);
   

    if (!isMember){
        return res.status(403).json({error : "U are not a member and cant see messages"});
    }



    const channelMessages = await message.find({
            channel_id: { $in: [cleanChannelId, String(rawChannelId)] }
        })
    .sort({_id : 1})
    .lean();

    if(channelMessages.length === 0 ){
        return  res.status(200).json({
        success : true,
        data : [],
        my_id : userId
    })
    }

     const senderIds = [...new Set (channelMessages.map((msg)=> msg.sender_id))];

     const [serndersInfo] = await pool.query(`SELECT id , username , email , avatar , created_at FROM USERS WHERE id IN (?)` , [senderIds])

     const useMap = {};
     serndersInfo.forEach((info)=>{
        useMap[info.id] = info;
     })

     const HydrateMessages = channelMessages.map(msg=>({
        ... msg , 
        sender : useMap[msg.sender_id] || {username : 'deleted user' , email : null , avatar : null , created_at : null }
     }))

 










    res.status(200).json({
        success : true,
        data : HydrateMessages ,
        my_id : userId
    })
}
catch(error) {
     console.log(error);
    return res.status(500).json({error : "Database error"});
}




})












module.exports = router;








