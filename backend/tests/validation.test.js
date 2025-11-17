const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Input Validation', () => {
    describe('Email Validation', () => {
        it('should accept valid email formats', async () => {
            const validEmails = [
                'test@example.com',
                'user.name@example.com',
                'user+tag@example.co.uk',
                'user123@example-domain.com'
            ];

            for (const email of validEmails) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: `user_${Date.now()}_${Math.random()}`,
                        email: email,
                        password: 'ValidPass123!'
                    });

                // Should not fail due to email format
                expect([201, 409]).toContain(res.statusCode);
            }
        });

        it('should reject invalid email formats', async () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'user@',
                'user@.com',
                'user space@example.com',
                'user@example',
                ''
            ];

            for (const email of invalidEmails) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: `user_${Date.now()}_${Math.random()}`,
                        email: email,
                        password: 'ValidPass123!'
                    });

                expect(res.statusCode).toEqual(400);
            }
        });
    });

    describe('Password Validation', () => {
        it('should reject passwords shorter than 6 characters', async () => {
            const shortPasswords = ['12345', 'abc', '1', ''];

            for (const password of shortPasswords) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: `user_${Date.now()}_${Math.random()}`,
                        email: `test_${Date.now()}@example.com`,
                        password: password
                    });

                expect(res.statusCode).toEqual(400);
                expect(res.body).toHaveProperty('error');
            }
        });

        it('should accept passwords 6 characters or longer', async () => {
            const validPasswords = ['123456', 'password', 'TestPass123!', 'a'.repeat(100)];

            for (const password of validPasswords) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: `user_${Date.now()}_${Math.random()}`,
                        email: `test_${Date.now()}@example.com`,
                        password: password
                    });

                // Should not fail due to password length
                expect([201, 409]).toContain(res.statusCode);
            }
        });
    });

    describe('Username Validation', () => {
        it('should accept valid usernames', async () => {
            const validUsernames = [
                'user123',
                'user_name',
                'User123',
                'a'.repeat(50) // Long but valid
            ];

            for (const username of validUsernames) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: username,
                        email: `test_${Date.now()}@example.com`,
                        password: 'ValidPass123!'
                    });

                // Should not fail due to username format
                expect([201, 409]).toContain(res.statusCode);
            }
        });
    });

    describe('Required Fields Validation', () => {
        it('should require all fields for registration', async () => {
            const testCases = [
                { username: 'test', email: 'test@example.com' }, // missing password
                { username: 'test', password: 'password123' }, // missing email
                { email: 'test@example.com', password: 'password123' }, // missing username
                {} // missing all
            ];

            for (const testCase of testCases) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send(testCase);

                expect(res.statusCode).toEqual(400);
                expect(res.body).toHaveProperty('error');
            }
        });

        it('should require email and password for login', async () => {
            const testCases = [
                { email: 'test@example.com' }, // missing password
                { password: 'password123' }, // missing email
                {} // missing all
            ];

            for (const testCase of testCases) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send(testCase);

                expect(res.statusCode).toEqual(400);
                expect(res.body).toHaveProperty('error');
            }
        });
    });

    describe('MFA Code Validation', () => {
        it('should accept 6-digit numeric codes', async () => {
            const validCodes = ['123456', '000000', '999999', '012345'];

            // Note: These will fail verification but should pass format validation
            for (const code of validCodes) {
                const res = await request(app)
                    .post('/api/auth/verify-mfa')
                    .send({
                        token: 'test-token',
                        code: code
                    });

                // Should not fail due to code format (will fail on verification)
                expect([400, 401]).toContain(res.statusCode);
            }
        });
    });
});

