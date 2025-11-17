const request = require('supertest');
const app = require('../app');
const { sequelize, Account } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Authentication API', () => {
    let testUser = null;
    let testToken = null;
    const testEmail = `test_${Date.now()}@example.com`;
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = 'TestPass123!';

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: testUsername,
                    email: testEmail,
                    password: testPassword
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user).toHaveProperty('username', testUsername);
            expect(res.body.user).toHaveProperty('email', testEmail);
            expect(res.body.user).not.toHaveProperty('password');
            
            testUser = res.body.user;
            testToken = res.body.token;
        });

        it('should reject registration with missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: testUsername
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject registration with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'invalid-email',
                    password: testPassword
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject registration with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser3',
                    email: 'test3@example.com',
                    password: '12345'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject duplicate email registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'differentuser',
                    email: testEmail,
                    password: testPassword
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject duplicate username registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: testUsername,
                    email: 'different@example.com',
                    password: testPassword
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body).toHaveProperty('error');
        });

        it('should hash password before storing', async () => {
            const newEmail = `hash_test_${Date.now()}@example.com`;
            const newUsername = `hashtest_${Date.now()}`;
            
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: newUsername,
                    email: newEmail,
                    password: testPassword
                });

            const account = await Account.findOne({ where: { email: newEmail } });
            expect(account).not.toBeNull();
            expect(account.password).not.toBe(testPassword);
            expect(account.password.length).toBeGreaterThan(20); // bcrypt hash length
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testEmail);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject login with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    password: testPassword
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject login with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject login with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: testPassword
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should require MFA when enabled', async () => {
            // Enable MFA for test user
            const account = await Account.findOne({ where: { email: testEmail } });
            const secret = speakeasy.generateSecret({ name: 'Test' });
            account.mfaSecret = secret.base32;
            account.mfaEnabled = true;
            await account.save();

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('requiresMFA', true);
            expect(res.body).toHaveProperty('tempToken');
            expect(res.body).not.toHaveProperty('token');
        });
    });

    describe('POST /api/auth/verify-mfa', () => {
        let mfaSecret = null;
        let tempToken = null;

        beforeEach(async () => {
            // Setup MFA
            const account = await Account.findOne({ where: { email: testEmail } });
            const secret = speakeasy.generateSecret({ name: 'Test' });
            mfaSecret = secret.base32;
            account.mfaSecret = mfaSecret;
            account.mfaEnabled = true;
            await account.save();

            // Get temp token
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });
            tempToken = loginRes.body.tempToken;
        });

        it('should verify valid MFA code', async () => {
            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const res = await request(app)
                .post('/api/auth/verify-mfa')
                .send({
                    token: tempToken,
                    code: code
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
        });

        it('should reject invalid MFA code', async () => {
            const res = await request(app)
                .post('/api/auth/verify-mfa')
                .send({
                    token: tempToken,
                    code: '000000'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject missing token', async () => {
            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const res = await request(app)
                .post('/api/auth/verify-mfa')
                .send({
                    code: code
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject missing code', async () => {
            const res = await request(app)
                .post('/api/auth/verify-mfa')
                .send({
                    token: tempToken
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject expired temp token', async () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { id: testUser.id, mfaRequired: true },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' }
            );

            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const res = await request(app)
                .post('/api/auth/verify-mfa')
                .send({
                    token: expiredToken,
                    code: code
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should accept password reset request', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: testEmail
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
        });

        it('should reject missing email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should not reveal if email exists', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'nonexistent@example.com'
                });

            // Should return same response for security
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
        });

        it('should generate reset token', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: testEmail
                });

            const account = await Account.findOne({ where: { email: testEmail } });
            expect(account.passwordResetToken).not.toBeNull();
            expect(account.passwordResetExpires).not.toBeNull();
        });
    });

    describe('POST /api/auth/reset-password', () => {
        let resetToken = null;

        beforeEach(async () => {
            // Generate reset token
            const account = await Account.findOne({ where: { email: testEmail } });
            const crypto = require('crypto');
            resetToken = crypto.randomBytes(32).toString('hex');
            account.passwordResetToken = resetToken;
            account.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
            await account.save();
        });

        it('should reset password with valid token', async () => {
            const newPassword = 'NewPass123!';
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: newPassword
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');

            // Verify password was changed
            const account = await Account.findOne({ where: { email: testEmail } });
            const isValid = await bcrypt.compare(newPassword, account.password);
            expect(isValid).toBe(true);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'invalid-token',
                    password: 'NewPass123!'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject expired token', async () => {
            const account = await Account.findOne({ where: { email: testEmail } });
            account.passwordResetExpires = new Date(Date.now() - 1000); // Expired
            await account.save();

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: 'NewPass123!'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject short password', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: '12345'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should clear reset token after use', async () => {
            await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: 'NewPass123!'
                });

            const account = await Account.findOne({ where: { email: testEmail } });
            expect(account.passwordResetToken).toBeNull();
            expect(account.passwordResetExpires).toBeNull();
        });
    });

    describe('POST /api/auth/setup-mfa', () => {
        it('should generate MFA secret and QR code', async () => {
            const res = await request(app)
                .post('/api/auth/setup-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('secret');
            expect(res.body).toHaveProperty('qrCode');
            expect(res.body.secret).toBeTruthy();
            expect(res.body.qrCode).toContain('data:image/png;base64');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/auth/setup-mfa')
                .send({});

            expect(res.statusCode).toEqual(401);
        });

        it('should save secret to account', async () => {
            const res = await request(app)
                .post('/api/auth/setup-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});

            const account = await Account.findOne({ where: { email: testEmail } });
            expect(account.mfaSecret).toBe(res.body.secret);
        });
    });

    describe('POST /api/auth/enable-mfa', () => {
        let mfaSecret = null;

        beforeEach(async () => {
            // Setup MFA
            const setupRes = await request(app)
                .post('/api/auth/setup-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});
            mfaSecret = setupRes.body.secret;
        });

        it('should enable MFA with valid code', async () => {
            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const res = await request(app)
                .post('/api/auth/enable-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    code: code
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');

            const account = await Account.findOne({ where: { email: testEmail } });
            expect(account.mfaEnabled).toBe(true);
        });

        it('should reject invalid code', async () => {
            const res = await request(app)
                .post('/api/auth/enable-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    code: '000000'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/auth/enable-mfa')
                .send({
                    code: '123456'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('POST /api/auth/disable-mfa', () => {
        let mfaSecret = null;

        beforeEach(async () => {
            // Setup and enable MFA
            const setupRes = await request(app)
                .post('/api/auth/setup-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});
            mfaSecret = setupRes.body.secret;

            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            await request(app)
                .post('/api/auth/enable-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ code });
        });

        it('should disable MFA with valid code', async () => {
            const code = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const res = await request(app)
                .post('/api/auth/disable-mfa')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    code: code
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');

            const account = await Account.findOne({ where: { email: testEmail } });
            expect(account.mfaEnabled).toBe(false);
            expect(account.mfaSecret).toBeNull();
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/auth/disable-mfa')
                .send({
                    code: '123456'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('JWT Token Validation', () => {
        it('should generate valid JWT token', async () => {
            // Create a fresh user without MFA for this test
            const freshEmail = `jwt_test_${Date.now()}@example.com`;
            const freshUsername = `jwttest_${Date.now()}`;
            
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: freshUsername,
                    email: freshEmail,
                    password: testPassword
                });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: freshEmail,
                    password: testPassword
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).not.toHaveProperty('requiresMFA');
            
            const token = res.body.token;
            expect(token).toBeTruthy();
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_change_in_production');
            
            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('email', freshEmail);
            expect(decoded).toHaveProperty('username');
        });

        it('should reject invalid JWT token', async () => {
            const res = await request(app)
                .get('/api/accounts/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).toEqual(403);
        });

        it('should reject missing token', async () => {
            const res = await request(app)
                .get('/api/accounts/me');

            expect(res.statusCode).toEqual(401);
        });
    });
});

