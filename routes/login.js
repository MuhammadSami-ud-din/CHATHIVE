require('dotenv').config();
const bcrypt = require("bcrypt");
const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET;



async function loginUser(PlainPassword , hashedPasswordFromDatabase) {
    const isMatch = await bcrypt.compare(PlainPassword , hashedPasswordFromDatabase);

    if(isMatch){
        console.log("login Successfull");
        return true;

    }else{
        console.log("invalid password ");
        return false;
        
    
        
    }
    
}
async function VerifyUserCredentials(email){
    try{
        const [rows] = await pool.query('SELECT password_hash , id  FROM USERS WHERE email=?' , [email]);
    if(rows.length === 0){
        return null;
    } else{
        return rows[0];
    }
    }
    catch(error){
        console.log (error.message);
        throw error;
    }
}

router.post('/login' , async (req , res)=>{
  try{ 
    
   const {email , password} = req.body;
   const userRecord = await VerifyUserCredentials(email);


   if(!userRecord){
    return res.status(401).json({error : "invalid Credentials"});
   }
   
   const {password_hash : hashedPasswordFromDatabase , id } = userRecord;
  
   const loginValid = await loginUser(password , hashedPasswordFromDatabase);
   if(!loginValid){
        return res.status(401).json({error : "Incorrect Password"});
    }

   if (loginValid){
    const payload = {
        email : email,
        id : id
    }
    const token = jwt.sign(payload , secret ,{expiresIn: '1h'});

    return res.status(200).json(
        {
            message : "Login Successfull",
            token : token
        }
    )
    
   }

   
}
catch(error) {
    console.log(error.message);
    res.status(500).json({error : "Internal Server Error"})
}
    

})


module.exports = router;








