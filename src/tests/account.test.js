const request = require('supertest');
const app = require('../app');
const { sequelize, Account } = require('../models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Account API', () => {
    it('should create a new account', async () => {
        const res = await request(app)
            .post('/api/accounts')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should fetch all accounts', async () => {
        const res = await request(app).get('/api/accounts');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should fetch an account by ID', async () => {
        const account = await Account.create({
            username: 'user2',
            email: 'user2@example.com',
            password: 'password123'
        });
        const res = await request(app).get(`/api/accounts/${account.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', account.id);
    });

    it('should update an account', async () => {
        const account = await Account.create({
            username: 'user3',
            email: 'user3@example.com',
            password: 'password123'
        });
        const res = await request(app)
            .put(`/api/accounts/${account.id}`)
            .send({
                username: 'updateduser3',
                email: 'updateduser3@example.com',
                password: 'newpassword123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', 'updateduser3');
    });

    it('should delete an account', async () => {
        const account = await Account.create({
            username: 'user4',
            email: 'user4@example.com',
            password: 'password123'
        });
        const res = await request(app).delete(`/api/accounts/${account.id}`);
        expect(res.statusCode).toEqual(204);
    });
});
