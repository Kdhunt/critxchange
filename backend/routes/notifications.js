const express = require('express');
const NotificationController = require('../controllers/notificationController');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateJWT, NotificationController.list);
router.post('/', authenticateJWT, NotificationController.create);
router.patch('/:id/read', authenticateJWT, NotificationController.markRead);
router.post('/:id/reply', authenticateJWT, NotificationController.reply);
router.delete('/:id', authenticateJWT, NotificationController.remove);

module.exports = router;
