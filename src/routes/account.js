const express = require('express');
const router = express.Router();
const { Account } = require('../models');
const bcrypt = require('bcryptjs');

// Get all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await Account.findAll();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get account by ID
router.get('/:id', async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.id);
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new account
router.post('/', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAccount = await Account.create({ username, email, password: hashedPassword });
        res.status(201).json(newAccount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an account
router.put('/:id', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [updated] = await Account.update(
            { username, email, password: hashedPassword },
            { where: { id: req.params.id } }
        );
        if (updated) {
            const updatedAccount = await Account.findByPk(req.params.id);
            res.json(updatedAccount);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete an account
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Account.destroy({ where: { id: req.params.id } });
        if (deleted) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
