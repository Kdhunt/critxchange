const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const authenticateJWT = require('../middleware/auth');
const ProfileController = require('../controllers/profileController');

const router = express.Router();

const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads', 'profiles');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeExt = ext || '.png';
        cb(null, `${req.user?.id || 'profile'}-${Date.now()}${safeExt}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image uploads are allowed'));
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});

router.get('/me', authenticateJWT, ProfileController.getOwnProfile);
router.put('/me', authenticateJWT, upload.single('avatar'), ProfileController.updateOwnProfile);
router.get('/:slug', ProfileController.getPublicProfile);

module.exports = router;
