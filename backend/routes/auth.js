const express = require('express');
const router = express.Router();
const passport = require('passport');
const { Account } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const authenticateJWT = require('../middleware/auth');

// Email transporter (configure for your email service)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Render login page
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Render register page
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Render forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { title: 'Forgot Password' });
});

// Render reset password page
router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/auth/forgot-password');
    }
    res.render('auth/reset-password', { title: 'Reset Password', token });
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const account = await Account.findOne({ where: { email } });
        if (!account) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if account has password (not OAuth-only)
        if (!account.password) {
            return res.status(401).json({ error: 'Please sign in with Google' });
        }

        const isValidPassword = await bcrypt.compare(password, account.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if MFA is enabled
        if (account.mfaEnabled) {
            // Generate temporary token for MFA verification
            const tempToken = jwt.sign(
                { id: account.id, email: account.email, mfaRequired: true },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );
            return res.json({
                requiresMFA: true,
                tempToken
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: account.id, email: account.email, username: account.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

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

// Verify MFA code
router.post('/verify-mfa', async (req, res) => {
    try {
        const { token, code } = req.body;

        if (!token || !code) {
            return res.status(400).json({ error: 'Token and code are required' });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!decoded.mfaRequired) {
            return res.status(400).json({ error: 'MFA not required for this token' });
        }

        const account = await Account.findByPk(decoded.id);
        if (!account || !account.mfaEnabled || !account.mfaSecret) {
            return res.status(400).json({ error: 'MFA not enabled for this account' });
        }

        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: account.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        // Generate final JWT token
        const finalToken = jwt.sign(
            { id: account.id, email: account.email, username: account.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token: finalToken,
            user: {
                id: account.id,
                username: account.username,
                email: account.email
            }
        });
    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existingAccount = await Account.findOne({
            where: {
                [require('sequelize').Op.or]: [{ email }, { username }]
            }
        });

        if (existingAccount) {
            return res.status(409).json({ error: 'Account with this email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAccount = await Account.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: newAccount.id, email: newAccount.email, username: newAccount.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

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
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Account with this email or username already exists' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const account = await Account.findOne({ where: { email } });
        
        // Don't reveal if email exists (security best practice)
        if (!account) {
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await account.update({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
        });

        // Send email (if SMTP is configured)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`;
            
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } else {
            // Development mode - log the token
            console.log('Password reset token (dev mode):', resetToken);
            console.log('Reset URL:', `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`);
        }

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const account = await Account.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!account) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await account.update({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Setup MFA endpoint
router.post('/setup-mfa', authenticateJWT, async (req, res) => {
    try {
        const accountId = req.user.id;

        const account = await Account.findByPk(accountId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `CritXChange (${account.email})`,
            issuer: 'CritXChange'
        });

        await account.update({
            mfaSecret: secret.base32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        console.error('MFA setup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enable MFA endpoint
router.post('/enable-mfa', authenticateJWT, async (req, res) => {
    try {
        const accountId = req.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const account = await Account.findByPk(accountId);
        if (!account || !account.mfaSecret) {
            return res.status(400).json({ error: 'MFA not set up. Please set up MFA first.' });
        }

        // Verify code
        const verified = speakeasy.totp.verify({
            secret: account.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        await account.update({ mfaEnabled: true });

        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        console.error('Enable MFA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Disable MFA endpoint
router.post('/disable-mfa', authenticateJWT, async (req, res) => {
    try {
        const accountId = req.user.id;
        const { code } = req.body;

        const account = await Account.findByPk(accountId);
        if (!account || !account.mfaEnabled) {
            return res.status(400).json({ error: 'MFA is not enabled' });
        }

        // Verify code before disabling
        if (code && account.mfaSecret) {
            const verified = speakeasy.totp.verify({
                secret: account.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 2
            });

            if (!verified) {
                return res.status(401).json({ error: 'Invalid verification code' });
            }
        }

        await account.update({
            mfaEnabled: false,
            mfaSecret: null
        });

        res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
        console.error('Disable MFA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// OAuth Google routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/login?error=oauth_failed' }), async (req, res) => {
    try {
        const account = req.user;
        
        // Check if MFA is enabled
        if (account.mfaEnabled) {
            // Generate temporary token for MFA verification
            const tempToken = jwt.sign(
                { id: account.id, email: account.email, mfaRequired: true },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );
            
            // Store temp token in session and redirect to MFA verification
            req.session.tempToken = tempToken;
            return res.redirect('/auth/verify-mfa');
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: account.id, email: account.email, username: account.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Store token in session and redirect to dashboard
        req.session.token = token;
        res.redirect('/dashboard?token=' + encodeURIComponent(token));
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/auth/login?error=oauth_failed');
    }
});

// Get temp token from session (for MFA verification page)
router.get('/temp-token', (req, res) => {
    if (!req.session.tempToken) {
        return res.status(404).json({ error: 'No temporary token found' });
    }
    res.json({ token: req.session.tempToken });
});

// MFA verification page (for OAuth flow)
router.get('/verify-mfa', (req, res) => {
    if (!req.session.tempToken) {
        return res.redirect('/auth/login');
    }
    res.render('auth/verify-mfa', { 
        title: 'Verify MFA'
    });
});

module.exports = router;
