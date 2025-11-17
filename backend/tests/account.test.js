const request = require('supertest');
const app = require('../app');
const { sequelize, Account } = require('../models');
const bcrypt = require('bcryptjs');

let authToken = null;
let testUserId = null;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create a test user and get auth token
    const testUser = await Account.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: await bcrypt.hash('password123', 10)
    });
    testUserId = testUser.id;
    
    // Login to get token
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'testuser@example.com',
            password: 'password123'
        });
    authToken = loginRes.body.token;
});

afterAll(async () => {
    await sequelize.close();
});

describe('Account API', () => {
    it('should create a new account (public registration)', async () => {
        const res = await request(app)
            .post('/api/accounts')
            .send({
                username: `newuser_${Date.now()}`,
                email: `newuser_${Date.now()}@example.com`,
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).not.toHaveProperty('password');
    });

    it('should fetch all accounts (requires auth)', async () => {
        const res = await request(app)
            .get('/api/accounts')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        // Verify no passwords in response
        res.body.forEach(account => {
            expect(account).not.toHaveProperty('password');
        });
    });

    it('should fetch current user account', async () => {
        const res = await request(app)
            .get('/api/accounts/me')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', testUserId);
        expect(res.body).not.toHaveProperty('password');
    });

    it('should fetch an account by ID (requires auth)', async () => {
        const res = await request(app)
            .get(`/api/accounts/${testUserId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', testUserId);
        expect(res.body).not.toHaveProperty('password');
    });

    it('should update own account', async () => {
        const res = await request(app)
            .put(`/api/accounts/${testUserId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                username: 'updateduser'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', 'updateduser');
        expect(res.body).not.toHaveProperty('password');
    });

    it('should reject updating other user account', async () => {
        // Create another user
        const otherUser = await Account.create({
            username: `otheruser_${Date.now()}`,
            email: `otheruser_${Date.now()}@example.com`,
            password: await bcrypt.hash('password123', 10)
        });
        
        const res = await request(app)
            .put(`/api/accounts/${otherUser.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                username: 'hacked'
            });
        expect(res.statusCode).toEqual(403);
    });

    it('should delete own account', async () => {
        // Create a user to delete
        const deleteUser = await Account.create({
            username: `deleteuser_${Date.now()}`,
            email: `deleteuser_${Date.now()}@example.com`,
            password: await bcrypt.hash('password123', 10)
        });
        
        // Get token for this user
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: deleteUser.email,
                password: 'password123'
            });
        const deleteToken = loginRes.body.token;
        
        const res = await request(app)
            .delete(`/api/accounts/${deleteUser.id}`)
            .set('Authorization', `Bearer ${deleteToken}`);
        expect(res.statusCode).toEqual(204);
    });

    it('should require authentication for protected routes', async () => {
        const routes = [
            { method: 'get', path: '/api/accounts' },
            { method: 'get', path: '/api/accounts/me' },
            { method: 'get', path: `/api/accounts/${testUserId}` },
            { method: 'put', path: `/api/accounts/${testUserId}` },
            { method: 'delete', path: `/api/accounts/${testUserId}` }
        ];

        for (const route of routes) {
            const res = await request(app)[route.method](route.path);
            expect(res.statusCode).toEqual(401);
        }
    });
});
