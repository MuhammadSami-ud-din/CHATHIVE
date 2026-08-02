
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

const cors = require('cors');
require('./config/mongo.js');
require ("./models/message.js")
const pool = require('./config/db.js');
const port = process.env.PORT || 3000
const verifyToken = require('./middleware/authMiddleWare.js');



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

io.on('connection' , (socket)=>{
   console.log(' A user Connected' , socket.id);

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
