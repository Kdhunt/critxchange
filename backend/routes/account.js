const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const { validateAccount } = require('../middleware/validation');
const AccountController = require('../controllers/accountController');

const isTestEnv = process.env.NODE_ENV === 'test';

const accountCreationLimiter = isTestEnv
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many accounts created from this IP, please try again later.' },
    });

// Get all accounts (requires authentication)
router.get('/', authenticateJWT, AccountController.getAllAccounts);

// Get current user's account (requires authentication)
router.get('/me', authenticateJWT, AccountController.getCurrentAccount);

// Get account by ID (requires authentication)
router.get('/:id', authenticateJWT, AccountController.getAccountById);

// Create a new account (public - registration) with rate limiting
router.post('/', accountCreationLimiter, validateAccount, AccountController.createAccount);

// Update an account (requires authentication - users can only update their own account)
router.put('/:id', authenticateJWT, validateAccount, AccountController.updateAccount);

// Delete an account (requires authentication - users can only delete their own account)
router.delete('/:id', authenticateJWT, AccountController.deleteAccount);

module.exports = router;
