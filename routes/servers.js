require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const verifyToken = require('../middleware/authMiddleWare');
const pool = require('../config/db.js');
const router = express.Router();
const mysql2 = require('mysql2/promise');
const redis = require('../redis.js');
const { upload } = require('../config/cloudinary.js');




router.post('/servers', verifyToken, async (req, res) => {
    upload.single('Image')(req,res, async (err)=>{
    if (err){
        console.error("Multer/Cloudinary error" , err)
        return res.status(500).json({
                error: err.message || "Cloudinary upload failed",
                details: err
            });
        }
       

    const { serverName, serverDescription, serverDest } = req.body;
    if (!serverDescription || !serverDest || !serverName) {
        return res.status(400).json({ error: "All field are required" });
    }

   

  

    const owner = req.user.id;
    let connection ; 

    try {
          connection = await pool.getConnection()
       await connection.beginTransaction();
         const imageUrl = req?.file?.path;


        const [query] = await connection.query(`INSERT INTO servers (server_name , server_description, server_dest , owner_id , avatar )
        VALUES (? ,? ,? , ? , ?)`, [serverName, serverDescription, serverDest, owner , imageUrl || null]);


        await connection.query(`INSERT INTO server_members ( server_id , members_id , role)
        VALUES (?,?,?)`, [query.insertId, owner, "owner"]);

        await connection.commit();

        const [newServer] = await pool.query(`SELECT * FROM servers WHERE server_id = ? `, [query.insertId]);

        await redis.del('servers:all');

        return res.status(201).json({
            message: "server created successfully",
            newServer: newServer[0]
        })
    }
    catch (error) {
        await connection.rollback();
        console.log(error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(401).json({ error: "server already exists" });
        }
        res.status(500).json({ error: "database error" });


    }
    finally {
        connection.release();
    }
     })
})


router.get('/servers', verifyToken, async (req, res) => {
    try {
        const cacheKey = 'servers:all';

        let cached = null;

       
        try {
            cached = await redis.get(cacheKey);
        } catch (redisErr) {
            console.warn("⚠️ Redis cache unavailable, falling back to Database:", redisErr.message);
        }
        if (cached) {
            const parsedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json(parsedData);
        }


        const [servers] = await pool.query('SELECT * FROM servers');

        await redis.set(cacheKey, JSON.stringify(servers), 'EX', 3600);
        res.status(200).json(servers);

    } catch (error) {
          console.log('error is ', error)
        res.status(500).json({ error: "cannot Fetch Database error" });
    }
    

})

router.get(`/servers/me`, verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [servers] = await pool.query(`SELECT * FROM servers S JOIN server_members SM ON S.server_id = SM.server_id
        WHERE SM.members_id = ? ` , [userId]);

        const [userInfo] = await pool.query(`SELECT username , id , avatar , created_at FROM USERS WHERE id = ? `, [userId]);

        if (userInfo.length === 0) {
            return res.status(404).json({ error: "Cannot find the user" });
        }




        return res.status(200).json({
            servers,
            userInfo: userInfo[0]
        });

    } catch (error) {
        console.error("FULL ROUTE CRASH ERROR:", error);
        res.status(500).json({ error: "cannot Fetch Database error" });
    }

})





module.exports = router;
