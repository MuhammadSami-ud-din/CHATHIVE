require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://chathive-chat.vercel.app", "http://localhost:5173", "http://192.168.18.40:5173"],
    credentials: true
  }
});
app.set('io', io);

const cors = require('cors');
require('./config/mongo.js');
require("./models/message.js")
const pool = require('./config/db.js');
const port = process.env.PORT || 3000
const host = process.env.Host || '0.0.0.0'
const verifyToken = require('./middleware/authMiddleWare.js');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;





const loginRoute = require('./routes/login.js');
const registerRoute = require('./routes/register.js');
const serverRoute = require('./routes/servers.js');
const channelRoute = require('./routes/channels.js');
const joinRoute = require('./routes/join.js');
const messageRoute = require('./routes/messages.js');
const DMRoute = require('./routes/directMessages.js');
const { Socket } = require('dgram');
const PPRoute = require('./routes/user.js');

app.use(express.json());
app.use(cors({
  origin: ["https://chathive-chat.vercel.app", "http://localhost:5173", "http://192.168.18.40:5173"],
  credentials: true
}));


app.use(loginRoute);
app.use(registerRoute);
app.use(serverRoute);
app.use(channelRoute);
app.use(joinRoute);
app.use(messageRoute);
app.use(DMRoute);
app.use(PPRoute);


app.get('/test-db', verifyToken, async (req, res) => {
  try {
    const [row] = await pool.query('SELECT 1+1 AS result');
    res.json({ message: "db connected", result: row[0].result })
  }
  catch (error) {
    res.status(500).json({ message: error.message })
  };


})

app.get('/health', async (req, res) => {
  try {
    const [row] = await pool.query('SELECT 1');
    res.status(200).json({ status: "healthy", db: "connected" });
  } catch (error) {
    console.error("Health check error:", error.message);
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});


io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('No Token provided'))
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return next(new Error('invalid Token'))
    }

    socket.user = decoded;
    next();
  })
})

const onlineUsers = new Map();
const channelTyping = new Map();

io.on('connection', (socket) => {
  console.log(' A user Connected', socket.id, socket.user.id);
  const userId = String(socket.user?.id || socket.user?.userId || socket.user?._id);
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);
  console.log('Emitting online users:', [...onlineUsers.keys()]);
  io.emit('get_online_users', [...onlineUsers.keys()]);

  socket.on('get_online_users_request', () => {
    socket.emit('get_online_users', [...onlineUsers.keys()]);
  });

  socket.on('start_typing', ({ conversation_id }) => {
    console.log('hi', conversation_id , 'start')
    socket.to(`conversation_${conversation_id}`).emit('start_typing', { userId })
  })

  socket.on('stop_typing', ({ conversation_id }) => {
    console.log( conversation_id , 'stop')
    socket.to(`conversation_${conversation_id}`).emit('stop_typing', { userId })
  })

  socket.on('join_channel', (channel_id) => {
    Array.from(socket.rooms).forEach((room)=>{
      if (room.startsWith('channel_')){
        socket.leave(room)
      }
    })
    socket.join(`channel_${channel_id}`);
    console.log(`user ${socket.user.id} joined the channel: ${channel_id}`);
  })

  socket.on('channel_typing' , (channel_id)=>{
    const chId = String(channel_id);

    if (!channelTyping.has(chId)) {
      channelTyping.set(chId, new Map());
    }

    const channelMap = channelTyping.get(chId);
    if (!channelMap.has(userId)) {
      channelMap.set(userId, new Set());
    }
    channelMap.get(userId).add(socket.id);

    const activeTypingUsers = Array.from(channelMap.keys());
    console.log('hi', chId , 'start' , 'person' , activeTypingUsers)

    socket.to(`channel_${chId}`).emit('channel_typing' , activeTypingUsers )
  })

  socket.on('stop_channel_typing', (channel_id) => {
    const chId = String(channel_id);
    const channelMap = channelTyping.get(chId);

    if (channelMap) {
      const userSockets = channelMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          channelMap.delete(userId);
        }
      }
      if (channelMap.size === 0) {
        channelTyping.delete(chId);
      }
    }

    const activeTypingUsers = channelMap ? Array.from(channelMap.keys()) : [];
    console.log('hi', chId , 'stop' , 'person' , activeTypingUsers)

    socket.to(`channel_${chId}`).emit('stop_channel_typing', activeTypingUsers)
  })

  socket.on('join_conversation', (conversation_id) => {
    socket.join(`conversation_${conversation_id}`);
    console.log(`user ${socket.user.id} joined the Conversation: ${conversation_id}`)
  })


  // socket.on('call_user' , ({receiverId , offer , callerInfo})=>{
  //   const userId = socket.id;

  //   const receiverSocketId = onlineUsers.get(String(receiverId));

  //    if(receiverSocketId === userId) return ;

  //   if(receiverSocketId){
  //     io.to(receiverSocketId).emit('incoming_call' , {
  //       offer , 
  //       from : callerInfo
  //     })
  //   }else{
  //     socket.emit('call_failed' , {reason : 'User is Offline '});
  //   }
  // })


  //  socket.on('answer_call', ({targetUserId , answer}) => {
  //   const targetSocketId = onlineUsers.get(targetUserId);

  //   if(targetSocketId){
  //     io.to(targetSocketId).emit('call_answered' , {answer});
  //   }
  // })

  //  socket.on('ice_candidate', ({targetUserId , candidate}) => {
  //   const targetSocketId = onlineUsers.get(targetUserId);

  //   if(targetSocketId){
  //     io.to(targetSocketId).emit('ice_candidate' , {candidate});
  //   }
  // })

  //  socket.on('end_call', ({targetUserId}) => {
  //   const targetSocketId = onlineUsers.get(targetUserId);

  //   if(targetSocketId){
  //     io.to(targetSocketId).emit('call_ended');
  //   }
  // })


 // WebRTC Call Handlers
  
 
 
 
 
 socket.on('call_user', ({ receiverId, offer, callerInfo }) => {
    const targetUserId = String(receiverId);
    const receiverSockets = onlineUsers.get(targetUserId);

    if (receiverSockets && receiverSockets.size > 0) {
      // Set ko Array mein convert karke saare active sockets ko call alert bhejo
      const socketIds = Array.from(receiverSockets);
      
      io.to(socketIds).emit('incoming_call', {
        offer,
        from: callerInfo
      });
      console.log(`Incoming call alert sent to user ${targetUserId} across sockets:`, socketIds);
    } else {
      socket.emit('call_failed', { reason: 'User is Offline' });
    }
  });

  socket.on('answer_call', ({ targetUserId, answer }) => {
    const targetSockets = onlineUsers.get(String(targetUserId));

    if (targetSockets && targetSockets.size > 0) {
      const socketIds = Array.from(targetSockets);
      io.to(socketIds).emit('call_answered', { answer });
    }
  });

  socket.on('ice_candidate', ({ targetUserId, candidate }) => {
    const targetSockets = onlineUsers.get(String(targetUserId));

    if (targetSockets && targetSockets.size > 0) {
      const socketIds = Array.from(targetSockets);
      io.to(socketIds).emit('ice_candidate', { candidate });
    }
  });

  socket.on('video_toggle', ({ targetUserId, videoOff }) => {
    const targetSocketIds = onlineUsers.get(String(targetUserId));

    if (targetSocketIds) {
        targetSocketIds.forEach((socketId) => {
            io.to(socketId).emit('video_toggle', { videoOff });
        });
    }
});

  socket.on('end_call', ({ targetUserId }) => {
    const targetSockets = onlineUsers.get(String(targetUserId));

    if (targetSockets && targetSockets.size > 0) {
      const socketIds = Array.from(targetSockets);
      io.to(socketIds).emit('call_ended');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
    }
    if (userSockets && userSockets.size === 0) {
      onlineUsers.delete(userId);
    }

    io.emit('get_online_users', [...onlineUsers.keys()]);

    channelTyping.forEach((channelMap, chId) => {
      const userMapSockets = channelMap.get(userId);
      if (userMapSockets) {
        userMapSockets.delete(socket.id);
        if (userMapSockets.size === 0) {
          channelMap.delete(userId);
        }
        if (channelMap.size === 0) {
          channelTyping.delete(chId);
        }
        const remainingUsers = Array.from(channelMap.keys());
        io.to(`channel_${chId}`).emit('stop_channel_typing', remainingUsers);
      }
    });

  })

})



// app.get('/' , (req , res) =>{
//     const responseData = {
//       message : "AOA bhai jaan aap ka backend kaam kr rha hai chawlien marna bnd kro",
//       status : "success"
//     }

//     res.json(responseData);
// })

server.listen(port, host, () => {
  console.log(`hello u are a fool and servers is running on port ${port}`)
})