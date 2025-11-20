const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const authenticateJWT = require('../middleware/auth');
const MessageController = require('../controllers/messageController');

const router = express.Router();

const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads', 'messages');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.bin';
        cb(null, `${req.user?.id || 'message'}-${Date.now()}${ext}`);
    },
});

const allowedTypes = [
    'image/',
    'text/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
];

const fileFilter = (_req, file, cb) => {
    const isAllowed = allowedTypes.some((type) => file.mimetype === type || file.mimetype.startsWith(type));
    if (!isAllowed) {
        cb(new Error('Unsupported file type. Please attach common documents or images.'));
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },
});

const uploadHandler = upload.array('attachments', 5);

router.post('/', authenticateJWT, (req, res, next) => {
    uploadHandler(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Unable to process attachments' });
        }
        return MessageController.sendToProfile(req, res, next);
    });
});

module.exports = router;
