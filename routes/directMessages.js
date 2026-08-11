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
     const receiverNum = Number(receiver_id);
    const conversation_id = await conversations.findOne({
        $or: [
           {user1_id : sender_id , user2_id : receiverNum},
           {user1_id : receiverNum , user2_id : sender_id}
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


    const io = req.app.get('io');
    console.log(`conversation_${savedMessage.conversation_id}` , savedMessage);
    io.to(`conversation_${savedMessage.conversation_id}`).emit('DMmessage' , savedMessage);


      return res.status(201).json({
      message: "Message sent successfully",
      data: savedMessage
});
    
    }


 const newConversation = new conversations({
        user1_id : sender_id,
        user2_id : receiverNum,
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

    const io = req.app.get('io');
    io.to(`conversation_${savedMessage.conversation_id}`).emit('DMmessage' , savedMessage);

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



router.get('/messages/dm/:receiver_id' , verifyToken , async(req , res)=>{
    const {receiver_id} = req.params;
    const sender_id = req.user.id;
  


    try{
        const receiverNum = Number(receiver_id);
     const chatMessages = await conversations.aggregate([
       {
        $match: {
             $or: [
                {user1_id : sender_id , user2_id : receiverNum },
                {user1_id : receiverNum , user2_id : sender_id}
             ]
        }
         },

         {
            $lookup : {
                 from : DM.collection.name,
                 localField : "conversation_id",
                 foreignField : "conversation_id",
                 as : "chat_messages"
            }
        }
     ])
   


     if(chatMessages.length === 0 ){
        return res.status(200).json({success : true , data : []});
     }


     res.status(200).json({
        success : true,
        data : chatMessages[0].chat_messages
     })


    }
    catch(error){
        console.log(error);
        res.status(500).json({
            error : "agregation error or database error"
        })

    }

})



router.get('/messages/dm' , verifyToken , async(req , res)=>{
   
    const user_id = req.user.id;
  


    try{
        
      const conversation = await conversations.findOne({
        $or: [
           {user1_id : user_id },
           {user2_id : user_id}
        ]
    }) 
   


     if(conversation.length === 0 ){
        return res.status(200).json({success : true , data : []});
     }
     console.log(conversation.user1_id , user_id)


       const targetUser = (user_id === conversation.user1_id) ? conversation.user2_id : conversation.user1_id
     
        const [query] = await pool.query(`SELECT * FROM USERS WHERE id=?`, [conversation.user2_id ])
        console.log()
 
    
     const [{password_hash , ...userInfo}] = query ; 
     console.log(userInfo)



     res.status(200).json({
        success : true,
        data : [userInfo]
     })


    }
    catch(error){
        console.log(error);
        res.status(500).json({
            error : "agregation error or database error"
        })

    }

})




module.exports = router;