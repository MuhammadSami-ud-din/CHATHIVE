
require('dotenv').config();

const express = require ('express');
const http = require('http');
const {Server} = require('socket.io')
const app = express();

const server = http.createServer(app);
const io = new Server(server , {
    cors : {
        origin : '*'
    }
}
)
app.set('io' , io);

const cors = require('cors');
require('./config/mongo.js');
require ("./models/message.js")
const pool = require('./config/db.js');
const port = process.env.PORT || 3000
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

app.use(express.json());
app.use(cors());


app.use(loginRoute);
app.use(registerRoute);
app.use(serverRoute); 
app.use(channelRoute);
app.use(joinRoute);
app.use(messageRoute);
app.use(DMRoute);

app.get('/test-db' ,verifyToken, async(req , res)=>{
    try{
        const [row] = await pool.query('SELECT 1+1 AS result');
        res.json({message: "db connected" , result : row[0].result})
    }
    catch(error){
  res.status(500).json({message: error.message})
    };
    
    
})
 
io.use((socket , next) =>{
const token = socket.handshake.auth.token;

 if(!token){
        return next(new Error('No Token provided'))
    }

jwt.verify(token , secret  , (err , decoded)=>{
    if(err){
        return next(new Error('invalid Token'))
    }

    socket.user = decoded;
    next();
})
})


io.on('connection' , (socket)=>{
   console.log(' A user Connected' , socket.id);

   socket.on('join_channel' , (channel_id)=>{
    socket.join(`channel_${channel_id}`);
    console.log(`user ${socket.user.id} joined the channel: ${channel_id}`)
   })

   socket.on('join_conversation' , (conversation_id)=>{
    socket.join(`conversation_${conversation_id}`);
     console.log(`user ${socket.user.id} joined the Conversation: ${conversation_id}`)
   })

   socket.on('disconnect' , ()=>{
    console.log('A user disconnected' , socket.id);
   })

})



// app.get('/' , (req , res) =>{
//     const responseData = {
//       message : "AOA bhai jaan aap ka backend kaam kr rha hai chawlien marna bnd kro",
//       status : "success"
//     }

//     res.json(responseData);
// })

server.listen(port , ()=>{
    console.log(`hello u are a fool and servers is running on port ${port}`)
})
