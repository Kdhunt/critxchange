const jwt = require('jsonwebtoken');
const { Account } = require('../models');

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 * Used for pages that work for both logged-in and logged-out users
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Check for token in session
        else if (req.session && req.session.token) {
            token = req.session.token;
        }
        // Check for token in query
        else if (req.query.token) {
            token = req.query.token;
        }

        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Fetch user from database
                const account = await Account.findByPk(decoded.id, {
                    attributes: { exclude: ['password', 'mfaSecret', 'passwordResetToken'] }
                });

                if (account) {
                    req.user = account;
                }
            } catch (error) {
                // Invalid token - that's okay, just continue without user
            }
        }
        
        next();
    } catch (error) {
        // Error getting user - that's okay, just continue without user
        next();
    }
};

module.exports = optionalAuth;

