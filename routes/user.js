const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');
const verifyToken = require('../middleware/authMiddleWare');
const { upload } = require('../config/cloudinary.js');
const redis = require('../redis.js');

router.post('/avatar-upload/:server_id', verifyToken, (req, res) => {
    const {server_id} = req.params
  
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            // THIS IS WHERE YOUR OBJECT ERROR WAS HIDDEN:
            console.error("Multer / Cloudinary Upload Error Details:", err);
            return res.status(500).json({
                error: err.message || "Cloudinary upload failed",
                details: err
            });
        }

        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({ error: 'Please upload an image file.' });
            }

            const imageUrl = req.file.path;

            const [updateResult] = await pool.query(
                `UPDATE servers SET server_img = ? WHERE server_id = ?`,
                [imageUrl , server_id]
            );

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            
            await redis.del('channels:all-' + server_id)


            return res.status(200).json({
                message: "Profile picture updated successfully",
                server_img : imageUrl
            });

        } catch (dbError) {
            console.error("Database Update Error:", dbError);
            return res.status(500).json({ error: "Failed to update database profile" });
        }
    });
});

module.exports = router;