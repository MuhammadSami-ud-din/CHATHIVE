require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('../config/db.js');
const verifyToken = require('../middleware/authMiddleWare');
const router = express.Router();


router.post('/channels/:server_id', verifyToken, async (req, res) => {

    try {
        const { server_id } = req.params;
        const memberId = Number(req.user.id);
        console.log(memberId);
        const [info] = await pool.query(`SELECT role FROM server_members WHERE members_id=? AND server_id = ?`, [memberId, server_id]);
        if (!info.length) {
            console.log({ info });
            return res.status(403).json({ error: "You are not a part of this server" });
        }
        const isAuthorized = info[0].role === 'owner' || info[0].role === 'admin' ? true : false;

        if (isAuthorized) {
            const { channel_name, channel_description } = req.body;

            if (!channel_name || !channel_description) {
                return res.status(401).json({ error: "all fields are required" });
            }




            const [query] = await pool.query(`INSERT INTO channels ( channel_name  , channel_description , current_server_id ) 
        VALUES(?,?,?)` , [channel_name, channel_description, server_id]);

            const [channelFetch] = await pool.query(`SELECT * FROM channels WHERE channel_id = ?`, [query.insertId]);

            if (channelFetch.length === 0) {
                return res.status(500).json({ error: "cannot fetch" });
            }



            return res.status(201).json({
                message: "Channel created successfully",
                channel_id: query.insertId,
                channelFetch: channelFetch[0]
            });


        }
        else {
            return res.status(401).json({ error: "U are not authorized to create a channel" })
        }

    }
    catch (error) {
        console.log(error);
        if (error.code === "ER_DUP_ENTRY"){
          return res.status(401).json({error : "Channel already exists"});
        }
        return res.status(500).json({ error: "Database error" });
    }

})


router.get('/channels/:server_id', verifyToken, async (req, res) => {
    const { server_id } = req.params;
    const user_id = req.user.id;

    try {
        const [query] = await pool.query(`SELECT * FROM channels where current_server_id = ?`, [server_id]);
        const [queryServer] = await pool.query(`SELECT * FROM servers where server_id = ?`, [server_id]);
        const [Role] = await pool.query(`SELECT * FROM server_members where server_id = ? AND members_id = ? AND role IN ('owner' , 'admin')`, [server_id, user_id]);

        if (query.length === 0) {
            return res.status(200).json({ message: "No channels found", Channels: [], Serverinfo: queryServer, role: Role });
        }



        res.status(201).json({
            message: 'Success',
            Channels: query,
            Serverinfo: queryServer,
            role: Role
        });
    }
    catch {
       return  res.status(500).json({ error: "Database error" })
    }
})


module.exports = router;