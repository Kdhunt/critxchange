const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/viewAuth');
const DashboardController = require('../controllers/dashboardController');

// Logout endpoint
router.post('/logout', DashboardController.logout);

module.exports = router;
