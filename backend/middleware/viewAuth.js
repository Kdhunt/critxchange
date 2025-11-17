const jwt = require('jsonwebtoken');
const { Account } = require('../models');

/**
 * Middleware to protect views (EJS pages)
 * Checks for JWT token in cookies, session, or query params
 * Redirects to login if not authenticated
 */
const requireAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in query (for OAuth redirects) - check first
        if (req.query.token) {
            token = req.query.token;
            // Store in cookie and session for future requests
            res.cookie('token', token, {
                httpOnly: false, // Allow client-side access
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            });
            if (req.session) {
                req.session.token = token;
            }
        }
        // Check for token in cookie
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Check for token in session
        else if (req.session && req.session.token) {
            token = req.session.token;
        }
        // Check for token in Authorization header
        else if (req.headers.authorization) {
            const authHeader = req.headers.authorization;
            token = authHeader.startsWith('Bearer ') 
                ? authHeader.slice(7) 
                : authHeader;
        }

        if (!token) {
            return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from database
        const account = await Account.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'mfaSecret', 'passwordResetToken'] }
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

