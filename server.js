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

io.on('connection', (socket) => {
  console.log(' A user Connected', socket.id, socket.user.id);
  const userId = socket.user?.id || socket.user?.userId || socket.user?._id;

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);
  console.log('Emitting online users:', [...onlineUsers.keys()]);
  io.emit('get_online_users', [...onlineUsers.keys()]);

  socket.on('start_typing', ({ conversation_id }) => {
    console.log('hi', conversation_id , 'start')
    socket.to(`conversation_${conversation_id}`).emit('start_typing', { userId: socket.user.id })
  })

  socket.on('stop_typing', ({ conversation_id }) => {
    console.log('hi', conversation_id , 'stop')
    socket.to(`conversation_${conversation_id}`).emit('stop_typing', { userId: socket.user.id })
  })

  socket.on('join_channel', (channel_id) => {
    socket.join(`channel_${channel_id}`);
    console.log(`user ${socket.user.id} joined the channel: ${channel_id}`);
  })

  socket.on('join_conversation', (conversation_id) => {
    socket.join(`conversation_${conversation_id}`);
    console.log(`user ${socket.user.id} joined the Conversation: ${conversation_id}`)
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);
    const userSockets = onlineUsers.get(socket.user.id);
    if (userSockets) {
      userSockets.delete(socket.id);
    }
    if (userSockets.size === 0) {
      onlineUsers.delete(socket.user.id);
    }

    io.emit('get_online_users', [...onlineUsers.keys()]);

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
