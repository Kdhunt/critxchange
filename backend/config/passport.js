const passport = require('passport');
const { Account } = require('../models');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    // Build callback URL - use full URL if provided, otherwise construct from request
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if profile has email
            if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
                return done(new Error('No email found in Google profile'), null);
            }

            const email = profile.emails[0].value;

            // Check if user exists with this Google ID
            let account = await Account.findOne({ where: { googleId: profile.id } });

            if (account) {
                return done(null, account);
            }

            // Check if user exists with this email
            account = await Account.findOne({ where: { email } });

            if (account) {
                // Link Google account to existing account
                account.googleId = profile.id;
                await account.save();
                return done(null, account);
            }

            // Create new account
            const displayName = profile.displayName || profile.name?.givenName || 'User';
            const username = `${displayName.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;

            account = await Account.create({
                username,
                email,
                googleId: profile.id,
                password: null, // OAuth-only account
            });

            return done(null, account);
        } catch (error) {
            console.error('Google OAuth strategy error:', error);
            return done(error, null);
        }
    }));
} else {
    console.log('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Account.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
