const express = require('express');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

// Example placeholder CRUD routes
router.get('/items', authenticateJWT, (req, res) => {
    res.json({ message: 'Listing items is not implemented yet.' });
});

router.post('/items', authenticateJWT, (req, res) => {
    res.status(501).json({ error: 'Creating items is not implemented yet.' });
});

router.put('/items/:id', authenticateJWT, (req, res) => {
    res.status(501).json({ error: 'Updating items is not implemented yet.' });
});

router.delete('/items/:id', authenticateJWT, (req, res) => {
    res.status(501).json({ error: 'Deleting items is not implemented yet.' });
});

module.exports = router;
