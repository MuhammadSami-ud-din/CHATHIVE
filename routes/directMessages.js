require ('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const message = require('../models/message.js');
const DM = require('../models/dm.js');
const conversations = require('../models/conversations.js');
const verifyToken = require('../middleware/authMiddleWare.js');
const router = express.Router();



router.post('/messages/dm/:receiver_id' , verifyToken , async(req , res)=>{
    const {receiver_id} = req.params;
    const sender_id = req.user.id;
    const {msg_content} = req.body;

try{

    const conversation_id = await conversations.findOne({
        $or: [
           {user1_id : sender_id , user2_id : receiver_id},
           {user1_id : receiver_id , user2_id : sender_id}
        ]
    }) 

    if(conversation_id){
      const newMessage = new DM({
        conversation_id : conversation_id.conversation_id,
        sender_id : sender_id,
        content : msg_content
       

      })

      newMessage.message_id = newMessage._id;

      const savedMessage = await newMessage.save();



      return res.status(201).json({
      message: "Message sent successfully",
      data: savedMessage
});
    
    }


 const newConversation = new conversations({
        user1_id : sender_id,
        user2_id : receiver_id,
   });

newConversation.conversation_id = newConversation._id;

const savedConversation = await newConversation.save();



 const firstMessage = new DM({
        conversation_id : savedConversation.conversation_id,
        sender_id : sender_id,
        content : msg_content
       

      })

      firstMessage.message_id = firstMessage._id;

      const savedMessage = await firstMessage.save();



      return res.status(201).json({
      message: "Message sent successfully",
      data: savedMessage
});



}catch(error){
    console.log(error)
    res.status(500).json({
        error : "Database error"
    })
}



})


module.exports = router;