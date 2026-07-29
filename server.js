
require('dotenv').config();
const express = require ('express');
const app = express();
const cors = require('cors');
const pool = require('./config/db.js');
const port = process.env.PORT || 3000



app.use(cors());

app.get('/test-db' , async(req , res)=>{
    try{
        const [row] = await pool.query('SELECT 1+1 AS result');
        res.json({message: "db connected" , result : row[0].result})
    }
    catch(error){
  res.status(500).json({message: error.message})
    };
    
    
})

// app.get('/' , (req , res) =>{
//     const responseData = {
//       message : "AOA bhai jaan aap ka backend kaam kr rha hai chawlien marna bnd kro",
//       status : "success"
//     }

//     res.json(responseData);
// })

app.listen(port , ()=>{
    console.log(`hello u are a fool and servers is running on port ${port}`)
})
