const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Debug check: log if environment variables are missing
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.error("CRITICAL ERROR: CLOUDINARY_CLOUD_NAME is undefined!");
        }

        return {
            folder: 'discord_avatars', 
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 300, height: 300, crop: 'fill' }] 
        };
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { upload, cloudinary };