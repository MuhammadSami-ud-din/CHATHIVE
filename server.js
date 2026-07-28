const express = require ('express');
require('dotenv').config();
const port = process.env.PORT || 3000
const app = express();
const cors = require('cors');


app.use(cors());

app.get('/' , (req , res) =>{
    const responseData = {
      message : "AOA bhai jaan aap ka backend kaam kr rha hai chawlien marna bnd kro",
      status : "success"
    }

    res.json(responseData);
})

app.listen(port , ()=>{
    console.log(`hello u are a fool and servers is running on port ${port}`)
})
