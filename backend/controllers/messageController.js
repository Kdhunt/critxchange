const fs = require('fs');
const { Notification, Profile } = require('../models');

const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

const formatPreview = (body) => {
    if (!body) return '';
    const condensed = body.replace(/\s+/g, ' ').trim();
    return condensed.length > 140 ? `${condensed.slice(0, 140)}…` : condensed;
};

const cleanupFiles = (files = []) => {
    files.forEach((file) => {
        try {
            fs.unlinkSync(file.path);
        } catch (error) {
            // Best-effort cleanup
            console.error('Failed to cleanup upload:', error.message);
        }
    });
};

class MessageController {
    static async sendToProfile(req, res) {
        try {
            const { subject, body, profileSlug } = req.body;
            const senderAccountId = req.user?.id;

            if (!senderAccountId) {
                cleanupFiles(req.files);
                return res.status(401).json({ error: 'Authentication required to send messages' });
            }

            if (!subject || !body || !profileSlug) {
                cleanupFiles(req.files);
                return res.status(400).json({ error: 'Subject, message body, and profile are required' });
            }

            const profile = await Profile.findOne({ where: { slug: profileSlug } });
            if (!profile) {
                cleanupFiles(req.files);
                return res.status(404).json({ error: 'The recipient profile could not be found' });
            }

            const attachments = Array.isArray(req.files) ? req.files : [];
            const totalSize = attachments.reduce((sum, file) => sum + file.size, 0);

            if (totalSize > MAX_TOTAL_BYTES) {
                cleanupFiles(attachments);
                return res.status(400).json({ error: 'Attachments cannot exceed 5 MB in total' });
            }

            const attachmentMetadata = attachments.map((file) => ({
                originalName: file.originalname,
                fileName: file.filename,
                size: file.size,
                mimeType: file.mimetype,
                url: `/uploads/messages/${file.filename}`,
            }));

            const notification = await Notification.create({
                accountId: profile.accountId,
                title: subject,
                body,
                category: 'external',
                sender: req.user?.username || 'CritXChange member',
                previewText: formatPreview(body),
                metadata: {
                    attachments: attachmentMetadata,
                    fromAccountId: senderAccountId,
                    fromUsername: req.user?.username || 'Member',
                    profileSlug,
                },
            });

            return res.status(201).json({
                notification,
                message: 'Your message has been sent to the profile owner.',
            });
        } catch (error) {
            console.error('Error sending profile message:', error);
            cleanupFiles(req.files);
            return res.status(500).json({ error: 'Unable to send your message right now' });
        }
    }
}

module.exports = MessageController;
