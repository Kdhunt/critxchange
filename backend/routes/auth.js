const express = require('express');
const router = express.Router();
const passport = require('passport');
const authenticateJWT = require('../middleware/auth');
const AuthController = require('../controllers/authController');

// View routes (render pages)
router.get('/login', AuthController.renderLogin);
router.get('/register', AuthController.renderRegister);
router.get('/forgot-password', AuthController.renderForgotPassword);
router.get('/reset-password', AuthController.renderResetPassword);
router.get('/verify-mfa', AuthController.renderVerifyMFA);

// API routes (authentication actions)
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/verify-mfa', AuthController.verifyMFA);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// MFA management routes (require authentication)
router.post('/setup-mfa', authenticateJWT, AuthController.setupMFA);
router.post('/enable-mfa', authenticateJWT, AuthController.enableMFA);
router.post('/disable-mfa', authenticateJWT, AuthController.disableMFA);

// OAuth routes
router.get('/google', (req, res, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect('/auth/login?error=oauth_not_configured');
    }
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/login?error=oauth_failed' }),
    AuthController.handleOAuthCallback,
);

// Utility routes
router.get('/temp-token', AuthController.getTempToken);

module.exports = router;
