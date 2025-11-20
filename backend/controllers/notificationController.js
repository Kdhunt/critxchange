const { Notification } = require('../models');

const formatPreview = (body, previewText) => {
    if (previewText) return previewText;
    if (!body) return '';
    const condensed = body.replace(/\s+/g, ' ').trim();
    return condensed.length > 140 ? `${condensed.slice(0, 140)}…` : condensed;
};

const seedIfEmpty = async (accountId) => {
    const existing = await Notification.count({ where: { accountId } });
    if (existing > 0) return null;

    const now = new Date();
    return Notification.bulkCreate([
        {
            accountId,
            category: 'system',
            sender: 'System Monitor',
            title: 'Welcome to your message center',
            body: 'You can manage security alerts, announcements, and service updates from this inbox. We created a few starter messages so you can see how everything works.',
            createdAt: now,
            updatedAt: now,
        },
        {
            accountId,
            category: 'admin',
            sender: 'Trust & Safety',
            title: 'Policy reminder',
            body: 'Our administrators may contact you directly if we detect unusual account activity. Replies from you are captured here as well.',
            createdAt: now,
            updatedAt: now,
        },
        {
            accountId,
            category: 'external',
            sender: 'Billing Service',
            title: 'Integration connected',
            body: 'An external service sent this notification to confirm that webhook deliveries are configured. You can mark it as read or archive it once reviewed.',
            createdAt: now,
            updatedAt: now,
        },
    ]);
};

class NotificationController {
    static async list(req, res) {
        try {
            const accountId = req.user.id;
            await seedIfEmpty(accountId);

            const notifications = await Notification.findAll({
                where: { accountId },
                order: [['createdAt', 'DESC']],
            });

            const payload = notifications.map((notification) => ({
                id: notification.id,
                title: notification.title,
                body: notification.body,
                sender: notification.sender,
                category: notification.category,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
                metadata: notification.metadata || {},
                preview: formatPreview(notification.body, notification.previewText),
            }));

            return res.json({
                notifications: payload,
                unreadCount: payload.filter((item) => !item.isRead).length,
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ error: 'Unable to load notifications' });
        }
    }

    static async create(req, res) {
        try {
            const accountId = req.user.id;
            const {
                title,
                body,
                category = 'system',
                sender = 'System',
                previewText = null,
                metadata = null,
            } = req.body;

            if (!title || !body) {
                return res.status(400).json({ error: 'Title and body are required' });
            }

            const notification = await Notification.create({
                accountId,
                title,
                body,
                category,
                sender,
                previewText: formatPreview(body, previewText),
                metadata,
            });

            return res.status(201).json({ notification });
        } catch (error) {
            console.error('Error creating notification:', error);
            return res.status(500).json({ error: 'Unable to create notification' });
        }
    }

    static async markRead(req, res) {
        try {
            const accountId = req.user.id;
            const { id } = req.params;
            const { isRead = true } = req.body;

            const notification = await Notification.findOne({ where: { id, accountId } });
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            notification.isRead = Boolean(isRead);
            await notification.save();

            return res.json({ notification });
        } catch (error) {
            console.error('Error updating notification:', error);
            return res.status(500).json({ error: 'Unable to update notification' });
        }
    }

    static async reply(req, res) {
        try {
            const accountId = req.user.id;
            const { id } = req.params;
            const { body } = req.body;

            if (!body || !body.trim()) {
                return res.status(400).json({ error: 'A reply message is required' });
            }

            const notification = await Notification.findOne({ where: { id, accountId } });
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            const replies = Array.isArray(notification.metadata?.replies)
                ? [...notification.metadata.replies]
                : [];

            const reply = {
                body: body.trim(),
                createdAt: new Date().toISOString(),
                sender: req.user.username || 'You',
            };

            const metadata = {
                ...(notification.metadata || {}),
                replies: [...replies, reply],
            };

            notification.metadata = metadata;
            notification.isRead = true;
            await notification.save();

            return res.json({ notification });
        } catch (error) {
            console.error('Error replying to notification:', error);
            return res.status(500).json({ error: 'Unable to send your reply' });
        }
    }

    static async remove(req, res) {
        try {
            const accountId = req.user.id;
            const { id } = req.params;

            const notification = await Notification.findOne({ where: { id, accountId } });
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            await notification.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting notification:', error);
            return res.status(500).json({ error: 'Unable to delete notification' });
        }
    }
}

module.exports = NotificationController;
