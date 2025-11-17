const passport = require('passport');
const { Account } = require('../models');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
        // Check if user exists with this Google ID
            let account = await Account.findOne({ where: { googleId: profile.id } });

            if (account) {
                return done(null, account);
            }

            // Check if user exists with this email
            account = await Account.findOne({ where: { email: profile.emails[0].value } });

            if (account) {
            // Link Google account to existing account
                account.googleId = profile.id;
                await account.save();
                return done(null, account);
            }

            // Create new account
            const username = `${profile.displayName.replace(/\s+/g, '_').toLowerCase()  }_${  Math.random().toString(36).substr(2, 5)}`;

            account = await Account.create({
                username,
                email: profile.emails[0].value,
                googleId: profile.id,
                password: null, // OAuth-only account
            });

            return done(null, account);
        } catch (error) {
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
