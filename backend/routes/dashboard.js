const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/viewAuth');

// Logout endpoint
router.post('/logout', (req, res) => {
    // Clear cookie
    res.clearCookie('token');
    
    // Clear session
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
        });
    }
    
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;

