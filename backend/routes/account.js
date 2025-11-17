const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const { validateAccount } = require('../middleware/validation');
const AccountController = require('../controllers/accountController');

// Get all accounts (requires authentication)
router.get('/', authenticateJWT, AccountController.getAllAccounts);

// Get current user's account (requires authentication)
router.get('/me', authenticateJWT, AccountController.getCurrentAccount);

// Get account by ID (requires authentication)
router.get('/:id', authenticateJWT, AccountController.getAccountById);

// Create a new account (public - registration)
router.post('/', validateAccount, AccountController.createAccount);

// Update an account (requires authentication - users can only update their own account)
router.put('/:id', authenticateJWT, validateAccount, AccountController.updateAccount);

// Delete an account (requires authentication - users can only delete their own account)
router.delete('/:id', authenticateJWT, AccountController.deleteAccount);

module.exports = router;
