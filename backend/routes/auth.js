const express = require('express');
const router = express.Router();
const { Account } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find account by email
        const account = await Account.findOne({ where: { email } });
        if (!account) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, account.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: account.id, email: account.email, username: account.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return token and user info (without password)
        res.json({
            token,
            user: {
                id: account.id,
                username: account.username,
                email: account.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password strength check
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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

        // Hash password and create account
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAccount = await Account.create({
            username,
            email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newAccount.id, email: newAccount.email, username: newAccount.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return token and user info (without password)
        res.status(201).json({
            token,
            user: {
                id: newAccount.id,
                username: newAccount.username,
                email: newAccount.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Account with this email or username already exists' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

