const jwt = require('jsonwebtoken');
const { Account, Profile } = require('../models');

const extractToken = (container) => {
    if (!container || typeof container !== 'object') return null;
    const { token: containerToken } = container;
    return containerToken;
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 * Used for pages that work for both logged-in and logged-out users
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in cookie
        token = extractToken(req.cookies)
            || extractToken(req.session)
            || extractToken(req.query);

        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Fetch user from database
                const account = await Account.findByPk(decoded.id, {
                    attributes: { exclude: ['password', 'mfaSecret', 'passwordResetToken'] },
                    include: [{ model: Profile, as: 'profile' }],
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
