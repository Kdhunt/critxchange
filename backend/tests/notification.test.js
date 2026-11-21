const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, Account, Notification } = require('../models');

let authToken;
let testAccount;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    testAccount = await Account.create({
        username: 'notifyuser',
        email: 'notifyuser@example.com',
        password: await bcrypt.hash('password123', 10),
    });

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            email: testAccount.email,
            password: 'password123',
        });

    authToken = loginRes.body.token;
});

beforeEach(async () => {
    await Notification.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Notification API', () => {
    const authHeader = () => ({ Authorization: `Bearer ${authToken}` });

    it('lists seeded notifications for a new account', async () => {
        const res = await request(app)
            .get('/api/notifications')
            .set(authHeader());

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.notifications)).toBe(true);
        expect(res.body.notifications.length).toBeGreaterThanOrEqual(3);
        res.body.notifications.forEach((notification) => {
            expect(notification).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    title: expect.any(String),
                    body: expect.any(String),
                    sender: expect.any(String),
                    category: expect.any(String),
                    createdAt: expect.any(String),
                }),
            );
        });
        expect(res.body.unreadCount).toBe(res.body.notifications.filter((n) => !n.isRead).length);
    });

    it('creates a notification with optional preview text', async () => {
        const res = await request(app)
            .post('/api/notifications')
            .set(authHeader())
            .send({
                title: 'Custom alert',
                body: 'Custom alert body',
                category: 'external',
                sender: 'Webhook',
                previewText: 'Custom preview',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.notification).toEqual(
            expect.objectContaining({
                title: 'Custom alert',
                body: 'Custom alert body',
                category: 'external',
                sender: 'Webhook',
                previewText: 'Custom preview',
                isRead: false,
            }),
        );
    });

    it('marks a notification as read and unread', async () => {
        const notification = await Notification.create({
            accountId: testAccount.id,
            title: 'Mark me',
            body: 'Mark read test',
        });

        const markRead = await request(app)
            .patch(`/api/notifications/${notification.id}/read`)
            .set(authHeader())
            .send({ isRead: true });

        expect(markRead.statusCode).toBe(200);
        expect(markRead.body.notification.isRead).toBe(true);

        const markUnread = await request(app)
            .patch(`/api/notifications/${notification.id}/read`)
            .set(authHeader())
            .send({ isRead: false });

        expect(markUnread.statusCode).toBe(200);
        expect(markUnread.body.notification.isRead).toBe(false);
    });

    it('appends replies and marks the notification as read', async () => {
        const notification = await Notification.create({
            accountId: testAccount.id,
            title: 'Reply here',
            body: 'Reply body',
            metadata: { replies: [] },
        });

        const res = await request(app)
            .post(`/api/notifications/${notification.id}/reply`)
            .set(authHeader())
            .send({ body: 'Thanks for the update' });

        expect(res.statusCode).toBe(200);
        expect(res.body.notification.isRead).toBe(true);
        expect(res.body.notification.metadata.replies).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    body: 'Thanks for the update',
                    sender: testAccount.username,
                }),
            ]),
        );
    });

    it('deletes a notification', async () => {
        const notification = await Notification.create({
            accountId: testAccount.id,
            title: 'Delete me',
            body: 'Delete body',
        });

        const res = await request(app)
            .delete(`/api/notifications/${notification.id}`)
            .set(authHeader());

        expect(res.statusCode).toBe(204);
        const remaining = await Notification.findByPk(notification.id);
        expect(remaining).toBeNull();
    });
});
