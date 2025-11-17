const express = require('express');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

// Example CRUD routes
router.get('/items', authenticateJWT, (_req, _res) => {
    // Get all items
});

router.post('/items', authenticateJWT, (_req, _res) => {
    // Create a new item
});

router.put('/items/:id', authenticateJWT, (_req, _res) => {
    // Update an item
});

router.delete('/items/:id', authenticateJWT, (_req, _res) => {
    // Delete an item
});

module.exports = router;
