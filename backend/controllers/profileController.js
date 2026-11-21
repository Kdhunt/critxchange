const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Account, Profile } = require('../models');
const { slugify } = require('../utils/slugify');
const availableServices = require('../data/services');

const AVATAR_RELATIVE_DIR = '/uploads/profiles';
const AVATAR_ABSOLUTE_DIR = path.join(__dirname, '..', 'public', 'uploads', 'profiles');

const ensureUploadDirectory = () => {
    if (!fs.existsSync(AVATAR_ABSOLUTE_DIR)) {
        fs.mkdirSync(AVATAR_ABSOLUTE_DIR, { recursive: true });
    }
};

const normalizeServices = (services = []) => {
    const values = Array.isArray(services) ? services : [];
    const normalized = values
        .map((service) => service?.toString().trim())
        .filter(Boolean)
        .filter((service, index, arr) => arr.indexOf(service) === index)
        .filter((service) => availableServices.includes(service));
    return normalized;
};

const buildProfileResponse = (profile) => ({
    id: profile.id,
    accountId: profile.accountId,
    displayName: profile.displayName,
    slug: profile.slug,
    bio: profile.bio,
    services: profile.services || [],
    avatarUrl: profile.avatarUrl,
    updatedAt: profile.updatedAt,
});

class ProfileController {
    static async getOrCreateProfile(account) {
        if (!account) return null;

        const currentProfile = await Profile.findOne({ where: { accountId: account.id } });
        if (currentProfile) {
            return currentProfile;
        }

        const baseSlug = slugify(account.username || `profile-${account.id}`);
        let slug = baseSlug;
        let conflict = await Profile.findOne({ where: { slug } });
        let attempt = 1;
        while (conflict) {
            slug = `${baseSlug}-${attempt + 1}`;
            // eslint-disable-next-line no-await-in-loop
            conflict = await Profile.findOne({ where: { slug } });
            attempt += 1;
        }

        return Profile.create({
            accountId: account.id,
            displayName: account.username,
            slug,
            bio: '',
            services: [],
        });
    }

    static async getOwnProfile(req, res) {
        try {
            const account = await Account.findByPk(req.user.id);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            const profile = await ProfileController.getOrCreateProfile(account);
            return res.json(buildProfileResponse(profile));
        } catch (error) {
            console.error('Error fetching profile:', error);
            return res.status(500).json({ error: 'Unable to load profile information' });
        }
    }

    static async updateOwnProfile(req, res) {
        try {
            const account = await Account.findByPk(req.user.id);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            const profile = await ProfileController.getOrCreateProfile(account);

            const { displayName, bio } = req.body;
            const servicesPayload = req.body.services;
            const parsedServices = typeof servicesPayload === 'string'
                ? (() => {
                    try {
                        const maybeArray = JSON.parse(servicesPayload);
                        return Array.isArray(maybeArray) ? maybeArray : [];
                    } catch (err) {
                        return [];
                    }
                })()
                : servicesPayload;

            if (!displayName || !displayName.trim()) {
                return res.status(400).json({ error: 'Display name is required' });
            }

            const newDisplayName = displayName.trim();
            if (newDisplayName.length > 80) {
                return res.status(400).json({ error: 'Display name must be 80 characters or fewer' });
            }

            const slugCandidate = slugify(newDisplayName, `profile-${account.id}`);
            const slugConflict = await Profile.findOne({
                where: {
                    slug: slugCandidate,
                    accountId: { [Op.ne]: account.id },
                },
            });

            if (slugConflict) {
                return res.status(409).json({ error: 'That display name is already in use. Please choose another.' });
            }

            profile.displayName = newDisplayName;
            profile.slug = slugCandidate;
            profile.bio = bio?.toString().slice(0, 1000) || '';
            profile.services = normalizeServices(parsedServices);

            if (req.file) {
                ensureUploadDirectory();
                if (profile.avatarUrl && profile.avatarUrl.startsWith(AVATAR_RELATIVE_DIR)) {
                    const existingPath = path.join(__dirname, '..', 'public', profile.avatarUrl);
                    if (fs.existsSync(existingPath)) {
                        fs.unlink(existingPath, () => {});
                    }
                }
                profile.avatarUrl = path.posix.join(AVATAR_RELATIVE_DIR, req.file.filename);
            }

            await profile.save();
            return res.json(buildProfileResponse(profile));
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Unable to update profile' });
        }
    }

    static async getPublicProfile(req, res) {
        try {
            const { slug } = req.params;
            const profile = await Profile.findOne({
                where: { slug },
                include: [{
                    model: Account,
                    as: 'account',
                    attributes: ['username', 'createdAt'],
                }],
            });

            if (!profile) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            return res.json(buildProfileResponse(profile));
        } catch (error) {
            console.error('Error fetching public profile:', error);
            return res.status(500).json({ error: 'Unable to load profile' });
        }
    }

    static async renderPublicProfile(req, res) {
        try {
            const { slug } = req.params;
            const profile = await Profile.findOne({
                where: { slug },
                include: [{
                    model: Account,
                    as: 'account',
                    attributes: ['username', 'createdAt'],
                }],
            });

            if (!profile) {
                return res.status(404).render('profile-public', {
                    title: 'Profile Not Found',
                    description: 'The requested profile could not be located',
                    user: req.user || null,
                    profile: null,
                    accountMeta: null,
                    notFound: true,
                });
            }

            return res.render('profile-public', {
                title: `${profile.displayName}'s Services`,
                description: `Learn more about ${profile.displayName}'s CritXChange services`,
                user: req.user || null,
                profile: buildProfileResponse(profile),
                accountMeta: profile.account,
                notFound: false,
            });
        } catch (error) {
            console.error('Error rendering public profile:', error);
            return res.status(500).render('profile-public', {
                title: 'Profile Error',
                description: 'Unable to load profile right now',
                user: req.user || null,
                profile: null,
                accountMeta: null,
                notFound: true,
            });
        }
    }
}

module.exports = ProfileController;
