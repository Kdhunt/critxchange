const { Account, Profile } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Account Controller
 * Handles all account-related business logic
 */
class AccountController {
    /**
     * Helper function to exclude password from account object
     */
    static excludePassword(account) {
        if (!account) return null;
        const accountObj = account.toJSON ? account.toJSON() : account;
        const accountWithoutPassword = { ...accountObj };
        delete accountWithoutPassword.password;
        return accountWithoutPassword;
    }

    /**
     * Get all accounts
     */
    static async getAllAccounts(req, res) {
        try {
            const accounts = await Account.findAll({
                attributes: { exclude: ['password'] },
                include: [{ model: Profile, as: 'profile' }],
            });
            res.json(accounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get current user's account
     */
    static async getCurrentAccount(req, res) {
        try {
            const account = await Account.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
                include: [{ model: Profile, as: 'profile' }],
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
    }

    /**
     * Get account by ID
     */
    static async getAccountById(req, res) {
        try {
            const account = await Account.findByPk(req.params.id, {
                attributes: { exclude: ['password'] },
                include: [{ model: Profile, as: 'profile' }],
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
    }

    /**
     * Create a new account (public - registration)
     */
    static async createAccount(req, res) {
        try {
            const { username, email, password } = req.body;

            // Validate required fields
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Username, email, and password are required' });
            }

            // Check if account already exists
            const existingAccount = await Account.findOne({
                where: {
                    [Op.or]: [{ email }, { username }],
                },
            });

            if (existingAccount) {
                return res.status(409).json({ error: 'Account with this email or username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newAccount = await Account.create({ username, email, password: hashedPassword });

            res.status(201).json(AccountController.excludePassword(newAccount));
        } catch (error) {
            console.error('Error creating account:', error);

            // Handle Sequelize validation errors
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Account with this email or username already exists' });
            }

            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update an account
     */
    static async updateAccount(req, res) {
        try {
            const accountId = parseInt(req.params.id, 10);

            // Users can only update their own account (unless admin in future)
            if (req.user.id !== accountId) {
                return res.status(403).json({ error: 'You can only update your own account' });
            }

            const { username, email, password, currentPassword } = req.body;
            const updateData = {};

            if (username === undefined && email === undefined && password === undefined) {
                return res.status(400).json({ error: 'Please provide at least one field to update' });
            }

            // Only include fields that are provided
            if (username !== undefined) updateData.username = username;
            if (email !== undefined) updateData.email = email;

            // Check if account exists
            const account = await Account.findByPk(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            if (password !== undefined) {
                if (!currentPassword) {
                    return res.status(400).json({ error: 'Current password is required to update your password' });
                }

                if (!account.password) {
                    return res.status(400).json({ error: 'Password updates are not available for this account' });
                }

                const passwordMatches = await bcrypt.compare(currentPassword, account.password);
                if (!passwordMatches) {
                    return res.status(403).json({ error: 'Current password is incorrect' });
                }

                updateData.password = await bcrypt.hash(password, 10);
            }

            // Check for conflicts if updating username or email
            if (username || email) {
                const conflictAccount = await Account.findOne({
                    where: {
                        id: { [Op.ne]: accountId },
                        [Op.or]: [
                            ...(username ? [{ username }] : []),
                            ...(email ? [{ email }] : []),
                        ],
                    },
                });

                if (conflictAccount) {
                    return res.status(409).json({ error: 'Username or email already in use' });
                }
            }

            const [updated] = await Account.update(updateData, {
                where: { id: accountId },
            });

            if (updated) {
                const updatedAccount = await Account.findByPk(accountId, {
                    attributes: { exclude: ['password'] },
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
    }

    /**
     * Delete an account
     */
    static async deleteAccount(req, res) {
        try {
            const accountId = parseInt(req.params.id, 10);

            // Users can only delete their own account (unless admin in future)
            if (req.user.id !== accountId) {
                return res.status(403).json({ error: 'You can only delete your own account' });
            }

            const { currentPassword } = req.body || {};

            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to delete your account' });
            }

            const account = await Account.findByPk(accountId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            if (!account.password) {
                return res.status(400).json({ error: 'Password confirmation is required before deleting this account' });
            }

            const passwordMatches = await bcrypt.compare(currentPassword, account.password);
            if (!passwordMatches) {
                return res.status(403).json({ error: 'Current password is incorrect' });
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
    }
}

module.exports = AccountController;
