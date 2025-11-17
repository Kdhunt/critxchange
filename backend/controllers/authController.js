const { Account } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

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

/**
 * Authentication Controller
 * Handles all authentication-related business logic
 */
class AuthController {
    /**
     * Render login page
     */
    static renderLogin(req, res) {
        res.render('auth/login', { title: 'Login' });
    }

    /**
     * Render register page
     */
    static renderRegister(req, res) {
        res.render('auth/register', { title: 'Register' });
    }

    /**
     * Render forgot password page
     */
    static renderForgotPassword(req, res) {
        res.render('auth/forgot-password', { title: 'Forgot Password' });
    }

    /**
     * Render reset password page
     */
    static renderResetPassword(req, res) {
        const { token } = req.query;
        if (!token) {
            return res.redirect('/auth/forgot-password');
        }
        res.render('auth/reset-password', { title: 'Reset Password', token });
    }

    /**
     * Handle user login
     */
    static async login(req, res) {
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
                    { expiresIn: '10m' },
                );
                return res.json({
                    requiresMFA: true,
                    tempToken,
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: account.id, email: account.email, username: account.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
            );

            res.json({
                token,
                user: {
                    id: account.id,
                    username: account.username,
                    email: account.email,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Handle user registration
     */
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Username, email, and password are required' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }

            // Check if user already exists
            const existingUser = await Account.findOne({
                where: {
                    [Op.or]: [{ email }, { username }],
                },
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(409).json({ error: 'Email already registered' });
                }
                if (existingUser.username === username) {
                    return res.status(409).json({ error: 'Username already taken' });
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create account
            const account = await Account.create({
                username,
                email,
                password: hashedPassword,
            });

            // Generate JWT token
            const token = jwt.sign(
                { id: account.id, email: account.email, username: account.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
            );

            res.status(201).json({
                token,
                user: {
                    id: account.id,
                    username: account.username,
                    email: account.email,
                },
            });
        } catch (error) {
            console.error('Registration error:', error);

            // Handle Sequelize unique constraint errors
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Account with this email or username already exists' });
            }

            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Verify MFA code
     */
    static async verifyMFA(req, res) {
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
                return res.status(400).json({ error: 'Invalid token type' });
            }

            const account = await Account.findByPk(decoded.id);
            if (!account || !account.mfaSecret) {
                return res.status(404).json({ error: 'Account not found or MFA not set up' });
            }

            // Verify MFA code
            const isValid = speakeasy.totp.verify({
                secret: account.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 2,
            });

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }

            // Generate final JWT token
            const finalToken = jwt.sign(
                { id: account.id, email: account.email, username: account.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
            );

            res.json({
                token: finalToken,
                user: {
                    id: account.id,
                    username: account.username,
                    email: account.email,
                },
            });
        } catch (error) {
            console.error('MFA verification error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Request password reset
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const account = await Account.findOne({ where: { email } });

            // Don't reveal if email exists (security best practice)
            if (!account) {
                return res.json({ message: 'If that email exists, a password reset link has been sent' });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour

            await account.update({
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            });

            // Send email (if configured)
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`;

                try {
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
                        `,
                    });
                } catch (emailError) {
                    console.error('Email send error:', emailError);
                    // Continue even if email fails
                }
            } else {
                // Development mode - log the token
                console.log('Password reset token (dev mode):', resetToken);
                console.log('Reset URL:', `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`);
            }

            res.json({ message: 'If that email exists, a password reset link has been sent' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Reset password with token
     */
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                return res.status(400).json({ error: 'Token and password are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            const account = await Account.findOne({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: {
                        [Op.gt]: new Date(),
                    },
                },
            });

            if (!account) {
                return res.status(400).json({ error: 'Invalid or expired reset token' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password and clear reset token
            await account.update({
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            });

            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Setup MFA (generate secret and QR code)
     */
    static async setupMFA(req, res) {
        try {
            const userId = req.user.id;

            const account = await Account.findByPk(userId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `CritXChange (${account.email})`,
                issuer: 'CritXChange',
            });

            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            // Save secret (but don't enable yet)
            await account.update({
                mfaSecret: secret.base32,
            });

            res.json({
                secret: secret.base32,
                qrCode: qrCodeUrl,
            });
        } catch (error) {
            console.error('MFA setup error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Enable MFA
     */
    static async enableMFA(req, res) {
        try {
            const userId = req.user.id;
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'MFA code is required' });
            }

            const account = await Account.findByPk(userId);
            if (!account || !account.mfaSecret) {
                return res.status(404).json({ error: 'MFA not set up. Please set up MFA first' });
            }

            // Verify code
            const isValid = speakeasy.totp.verify({
                secret: account.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 2,
            });

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }

            // Enable MFA
            await account.update({
                mfaEnabled: true,
            });

            res.json({ message: 'MFA enabled successfully' });
        } catch (error) {
            console.error('Enable MFA error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Disable MFA
     */
    static async disableMFA(req, res) {
        try {
            const userId = req.user.id;
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'MFA code is required' });
            }

            const account = await Account.findByPk(userId);
            if (!account || !account.mfaEnabled) {
                return res.status(400).json({ error: 'MFA is not enabled' });
            }

            // Verify code before disabling
            const isValid = speakeasy.totp.verify({
                secret: account.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 2,
            });

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }

            // Disable MFA
            await account.update({
                mfaEnabled: false,
                mfaSecret: null,
            });

            res.json({ message: 'MFA disabled successfully' });
        } catch (error) {
            console.error('Disable MFA error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get temporary token from session (for MFA verification page)
     */
    static getTempToken(req, res) {
        if (!req.session.tempToken) {
            return res.status(404).json({ error: 'No temporary token found' });
        }
        res.json({ token: req.session.tempToken });
    }

    /**
     * Handle OAuth callback (Google)
     */
    static async handleOAuthCallback(req, res) {
        try {
            // Check if authentication failed
            if (!req.user) {
                return res.redirect('/auth/login?error=oauth_failed');
            }

            const account = req.user;

            // Check if MFA is enabled
            if (account.mfaEnabled) {
                // Generate temporary token for MFA verification
                const tempToken = jwt.sign(
                    { id: account.id, email: account.email, mfaRequired: true },
                    process.env.JWT_SECRET,
                    { expiresIn: '10m' },
                );

                // Store temp token in session and redirect to MFA verification
                req.session.tempToken = tempToken;
                return res.redirect('/auth/verify-mfa');
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: account.id, email: account.email, username: account.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
            );

            // Store token in session and cookie
            req.session.token = token;
            res.cookie('token', token, {
                httpOnly: false, // Allow client-side access
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });

            // Redirect to dashboard with token in query (for immediate auth)
            res.redirect(`/dashboard?token=${encodeURIComponent(token)}`);
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect('/auth/login?error=oauth_failed');
        }
    }

    /**
     * Render MFA verification page (for OAuth flow)
     */
    static renderVerifyMFA(req, res) {
        if (!req.session.tempToken) {
            return res.redirect('/auth/login');
        }
        res.render('auth/verify-mfa', {
            title: 'Verify MFA',
        });
    }
}

module.exports = AuthController;
