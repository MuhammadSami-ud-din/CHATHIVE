require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const verifyToken = require('../middleware/authMiddleWare');
const pool = require('../config/db.js');
const router = express.Router();
const mysql2 = require('mysql2/promise');
const redis = require('../redis.js');




router.post('/servers', verifyToken, async (req, res) => {
    const { serverName, serverDescription, serverDest } = req.body;
    if (!serverDescription || !serverDest || !serverName) {
        return res.status(400).json({ error: "All field are required" });
    }

    const owner = req.user.id;

    try {
        const [query] = await pool.query(`INSERT INTO servers (server_name , server_description, server_dest , owner_id )
        VALUES (? ,? ,? , ?)`, [serverName, serverDescription, serverDest, owner]);


        await pool.query(`INSERT INTO server_members ( server_id , members_id , role)
        VALUES (?,?,?)`, [query.insertId, owner, "owner"]);

        const [newServer] = await pool.query(`SELECT * FROM servers WHERE server_id = ? `, [query.insertId]);

        await redis.del('servers:all');

        res.status(201).json({
            message: "server created successfully",
            newServer: newServer[0]
        })
    }
    catch (error) {
        console.log(error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(401).json({ error: "server already exists" });
        }
        res.status(500).json({ error: "database error" });


    }
})


router.get('/servers', verifyToken, async (req, res) => {
    try {
        const cacheKey = 'servers:all';

        const cached = await redis.get(cacheKey);
        if (cached) {
            const parsedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json(parsedData);
        }


        const [servers] = await pool.query('SELECT * FROM servers');

        await redis.set(cacheKey, JSON.stringify(servers), 'EX' , 3600);
        res.status(200).json(servers);

    } catch(error) {
        console.log(error.message)
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

    } catch(error) {
        console.log(error.message);
        res.status(500).json({ error: "cannot Fetch Database error" });
    }

})





module.exports = router;
