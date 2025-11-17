const express = require('express');
const router = express.Router();
const { Account } = require('../models');
const bcrypt = require('bcryptjs');
const authenticateJWT = require('../middleware/auth');
const { validateAccount } = require('../middleware/validation');

// Helper function to exclude password from account object
const excludePassword = (account) => {
    if (!account) return null;
    const accountObj = account.toJSON ? account.toJSON() : account;
    const { password, ...accountWithoutPassword } = accountObj;
    return accountWithoutPassword;
};

// Get all accounts (requires authentication)
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const accounts = await Account.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user's account (requires authentication)
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        const account = await Account.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get account by ID (requires authentication)
router.get('/:id', authenticateJWT, async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new account (public - registration)
router.post('/', validateAccount, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if account already exists
        const existingAccount = await Account.findOne({
            where: {
                [require('sequelize').Op.or]: [{ email }, { username }]
            }
        });

        if (existingAccount) {
            return res.status(409).json({ error: 'Account with this email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAccount = await Account.create({ username, email, password: hashedPassword });
        
        res.status(201).json(excludePassword(newAccount));
    } catch (error) {
        console.error('Error creating account:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Account with this email or username already exists' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an account (requires authentication - users can only update their own account)
router.put('/:id', authenticateJWT, validateAccount, async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);
        
        // Users can only update their own account (unless admin in future)
        if (req.user.id !== accountId) {
            return res.status(403).json({ error: 'You can only update your own account' });
        }

        const { username, email, password } = req.body;
        const updateData = {};

        // Only include fields that are provided
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (password !== undefined) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Check if account exists
        const account = await Account.findByPk(accountId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check for conflicts if updating username or email
        if (username || email) {
            const conflictAccount = await Account.findOne({
                where: {
                    id: { [require('sequelize').Op.ne]: accountId },
                    [require('sequelize').Op.or]: [
                        ...(username ? [{ username }] : []),
                        ...(email ? [{ email }] : [])
                    ]
                }
            });

            if (conflictAccount) {
                return res.status(409).json({ error: 'Username or email already in use' });
            }
        }

        const [updated] = await Account.update(updateData, {
            where: { id: accountId }
        });

        if (updated) {
            const updatedAccount = await Account.findByPk(accountId, {
                attributes: { exclude: ['password'] }
            });
            res.json(updatedAccount);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        console.error('Error updating account:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Username or email already in use' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an account (requires authentication - users can only delete their own account)
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);
        
        // Users can only delete their own account (unless admin in future)
        if (req.user.id !== accountId) {
            return res.status(403).json({ error: 'You can only delete your own account' });
        }

        const deleted = await Account.destroy({ where: { id: accountId } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
