const bcrypt = require("bcrypt");
const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');



async function registerUser(plainPassword) {
try{
    const salt= 10;

    const hashedPassword = await bcrypt.hash(plainPassword , salt);

    return hashedPassword;

}
catch(error){
    console.log(error.message);
    throw error;
}
    
}

router.post('/register' , async (req , res)=>{
    const {userName , email , plainPassword} = req.body;

   const hashedPassword = await registerUser(plainPassword);
   
if(!hashedPassword){
    return res.status(500).json({error : "Hashing error"});
   }

   try{
   const query = await pool.query(`INSERT INTO USERS(username , email , password_hash)
    VALUES (? ,? , ?)` ,[userName , email , hashedPassword]);

    return res.status(201).json({ message: "User registered successfully!" });

   }
   catch(error){
      console.error("MySQL Query Failed:", error.message, "Error Code:", error.code);
      
    if (error.code ==='ER_DUP_ENTRY'){
       return  res.status(409).json({error : "email or username already exists"})
    }
    res.status(500).json({error : "Database error"});
   }

})


module.exports = router;




