const jwt = require('jsonwebtoken');
const { Account, Profile } = require('../models');

const extractToken = (container) => {
    if (!container || typeof container !== 'object') return null;
    const { token: containerToken } = container;
    return containerToken;
};

/**
 * Middleware to protect views (EJS pages)
 * Checks for JWT token in cookies, session, or query params
 * Redirects to login if not authenticated
 */
const requireAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in query (for OAuth redirects) - check first
        const queryToken = extractToken(req.query);
        if (queryToken) {
            token = queryToken;
            // Store in cookie and session for future requests
            res.cookie('token', token, {
                httpOnly: false, // Allow client-side access
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            });
            if (req.session) {
                req.session.token = token;
            }
        }

        if (!token) {
            token = extractToken(req.cookies) || extractToken(req.session);
        }

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader;
        }

        if (!token) {
            return res.redirect(`/auth/login?redirect=${  encodeURIComponent(req.originalUrl)}`);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from database
        const account = await Account.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'mfaSecret', 'passwordResetToken'] },
            include: [{ model: Profile, as: 'profile' }],
        });

        if (!account) {
            return res.redirect('/auth/login?error=account_not_found');
        }

        // Attach user to request
        req.user = account;
        req.token = token;

        next();
    } catch (error) {
        // Token invalid or expired
        return res.redirect('/auth/login?error=session_expired');
    }
};

module.exports = requireAuth;
