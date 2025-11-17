const express = require('express');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

// Example CRUD routes
router.get('/items', authenticateJWT, (req, res) => {
    // Get all items
});

router.post('/items', authenticateJWT, (req, res) => {
    // Create a new item
});

router.put('/items/:id', authenticateJWT, (req, res) => {
    // Update an item
});

router.delete('/items/:id', authenticateJWT, (req, res) => {
    // Delete an item
});

module.exports = router;
