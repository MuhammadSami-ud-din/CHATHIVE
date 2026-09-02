require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const message = require('../models/message.js');
const DM = require('../models/dm.js');
const conversations = require('../models/conversations.js');
const verifyToken = require('../middleware/authMiddleWare.js');
const router = express.Router();




router.post('/messages/dm/:receiver_id', verifyToken, async (req, res) => {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;
    const { msg_content, conversation_id } = req.body;

    try {

        if (!msg_content || !msg_content.trim()) {
            return res.status(400).json({ error: "Message content cannot be empty" });
        }
        const receiverNum = Number(receiver_id);
        let targetConversationId = conversation_id;

        if (!targetConversationId) {
            const conversation = await conversations.findOne({
                $or: [
                    { user1_id: sender_id, user2_id: receiverNum },
                    { user1_id: receiverNum, user2_id: sender_id }
                ]
            });

            if (!conversation) {
                return res.status(404).json({ error: "Conversation not found. Please initialize chat first." });
            }
            targetConversationId = conversation.conversation_id;
        }



        const newMessage = new DM({
            conversation_id: targetConversationId,
            sender_id: sender_id,
            content: msg_content
        });



        newMessage.message_id = newMessage._id;

        const savedMessage = await newMessage.save();


        const io = req.app.get('io');
        console.log(`conversation_${savedMessage.conversation_id}`, savedMessage);
        io.to(`conversation_${savedMessage.conversation_id}`).emit('DMmessage', savedMessage);


        return res.status(201).json({
            message: "Message sent successfully",
            data: savedMessage
        });

    }

    catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Database error"
        })
    }



})


router.post('/messages/get_Create/:receiver_id', verifyToken, async (req, res) => {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;

    try {
        const senderNum = Number(sender_id);
        const receiverNum = Number(receiver_id);

        if (isNaN(receiverNum)) {
            return res.status(400).json({ error: "Invalid receiver ID format" });
        }


        const existingConversation = await conversations.findOne({
            $or: [
                { user1_id: senderNum, user2_id: receiverNum },
                { user1_id: receiverNum, user2_id: senderNum }
            ]
        });


        if (existingConversation) {
            return res.status(200).json({
                message: "Existing conversation retrieved",
                conversation: existingConversation
            });
        }


        const newConversation = new conversations({
            user1_id: senderNum,
            user2_id: receiverNum,
        });

        newConversation.conversation_id = newConversation._id;
        const savedConversation = await newConversation.save();

        const [receiverInfo] = await pool.query('SELECT username , id , avatar  FROM USERS WHERE id= ?', [receiver_id])




        return res.status(201).json({
            message: "New Conversation Created",
            conversation: savedConversation,
            FriendsInfo: receiverInfo[0]

        });

    } catch (error) {
        console.error("Create Conversation Error:", error);
        return res.status(500).json({ error: "Database error" });
    }
});



router.get('/messages/dm/:receiver_id', verifyToken, async (req, res) => {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;



    try {
        const receiverNum = Number(receiver_id);
        const senderNum = Number(sender_id);
        const chatMessages = await conversations.aggregate([
            {
                $match: {
                    $or: [
                        { user1_id: senderNum, user2_id: receiverNum },
                        { user1_id: receiverNum, user2_id: senderNum }
                    ]
                }
            },

            {
                $lookup: {
                    from: DM.collection.name,
                    localField: "conversation_id",
                    foreignField: "conversation_id",
                    as: "chat_messages"
                }
            }
        ])

        const [query] = await pool.query(`SELECT * FROM USERS WHERE id=?`, [receiver_id])

        if (query.length === 0) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const { password_hash, ...userRestInfo } = query[0]


        if (chatMessages.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                my_id: sender_id,
                user: userRestInfo
            });
        }




        res.status(200).json({
            success: true,
            data: chatMessages[0].chat_messages,
            my_id: sender_id,
            user: userRestInfo
        })


    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            error: "agregation error or database error"
        })

    }

})



router.get('/messages/dm', verifyToken, async (req, res) => {

    const user_id = req.user.id;



    try {

        const conversationHas = await conversations.find({
            $or: [
                { user1_id: user_id },
                { user2_id: user_id }
            ]
        })

        const FriendsInfos = []



        if (conversationHas.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }



        await Promise.all(
            conversationHas.map(async (conversation, index) => {
                const targetUser = (user_id === conversation.user1_id) ? conversation.user2_id : conversation.user1_id

                const [query] = await pool.query(`SELECT * FROM USERS WHERE id=?`, [targetUser])



                if (query && query.length > 0) {
                    const { password_hash, ...userInfo } = query[0];
                    FriendsInfos[index] = userInfo;
                } else {
                    FriendsInfos[index] = null;
                }



            })
        )

        const FriendsInfo = FriendsInfos.filter(Boolean);




        res.status(200).json({
            success: true,
            data: FriendsInfo
        })


    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            error: "agregation error or database error"
        })

    }

})


router.get('/users/search', verifyToken, async (req, res) => {

    const { query } = req.query;

    if (!query || !query.trim()) {
        return res.status(200).json({
            success: true,
            data: []
        });
    }

    const cleanedQuery = query.replace(/[%_]/g, '\\$&')
    console.log(cleanedQuery, query)



    try {

        const [Users] = await pool.query(`SELECT username , id , created_at , avatar , email  FROM USERS WHERE username LIKE CONCAT('%' , ? , '%') `, [cleanedQuery])
        console.log(Users)

        if (Users.length === 0) {
            return res.status(200).json({ message: "No User with this Username Found!!" });
        }



        return res.status(200).json({
            success: true,
            data: Users
        })


    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Database error"
        })

    }

})




router.delete('/messages/dm/delete/:msg_id', verifyToken, async (req, res) => {
  const { msg_id } = req.params;
  const sender_id = req.user.id;

  try {
    // 1. Search the DM collection by message_id
    const message = await DM.findOne({ message_id: msg_id });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 2. Safely compare MySQL IDs (convert both to Numbers or Strings)
    if (Number(message.sender_id) !== Number(sender_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 3. DELETE FROM THE DM COLLECTION! (Not conversations)
    await DM.deleteOne({ message_id: msg_id });

    // 4. Socket Broadcast (using matching schema field conversation_id)
    const conversationId = message.conversation_id;
    const io = req.app.get('io');

    io.to(`conversation_${conversationId}`).emit('delete_message', {
      messageId: msg_id,
      conversation_id: conversationId,
    });

    return res.status(200).json({ success: true, messageId: msg_id });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});




module.exports = router;