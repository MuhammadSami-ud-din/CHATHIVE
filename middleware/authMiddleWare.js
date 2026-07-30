const jwt = require ('jsonwebtoken');
const express = require('express')
const router = express.Router();


function verifyToken(req , res ,next){
    const authenticationHeader = req.headers['authentication'] ;
    const token = authenticationHeader && authenticationHeader.split(' ')[1];

    if (!token){
       return res.status(404).json({error : "Token not provided"});
    }

    jwt.verify(token , secret , (err , decoded) => {
        if (err){return res.status(401).json({  error : "Invlaid token" })};
        req.user = decoded;
        next();
    })
}

module.exports = verifyToken;
