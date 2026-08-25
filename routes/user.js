const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');
const verifyToken = require('../middleware/authMiddleWare');
const { upload } = require('../config/cloudinary.js');
const redis = require('../redis.js');

router.post('/avatar-upload', verifyToken, upload.single('avatar', (res, req) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.json({ error: 'Please uplaod the image.' });
        }

        const imageUrl = req.file.path;

        const [updateResult] = await pool.query(
            `UPDATE users SET avatar = ? WHERE id = ?`,
            [imageUrl, userId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "Profile picture updated successfully",
            avatar: imageUrl
        });

    }
    catch (error) {
        console.error("Avatar Upload Error:", error);
        return res.status(500).json({ error: "Failed to upload image" });
    }




}))

module.exports = router;