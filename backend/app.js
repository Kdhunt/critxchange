const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const apiRoutes = require('./routes/api');
const accountRoutes = require('./routes/account');
const profileRoutes = require('./routes/profile');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const PageController = require('./controllers/pageController');
const DashboardController = require('./controllers/dashboardController');
const ProfileController = require('./controllers/profileController');
const requireAuth = require('./middleware/viewAuth');
const optionalAuth = require('./middleware/optionalAuth');
const cookieParser = require('cookie-parser');
const validateEnv = require('./config/validateEnv');

// Initialize passport config
require('./config/passport');

validateEnv();

const app = express();
const isTestEnv = process.env.NODE_ENV === 'test';

const defaultAllowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultAllowedOrigins;

const allowAllOrigins = process.env.CORS_ALLOW_ALL === 'true';

app.use(cors({
    origin: (origin, callback) => {
        if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Configure Helmet with CSP that allows inline scripts and Google OAuth
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"], // Allow inline scripts and Google OAuth
            styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"], // Allow inline styles and Google OAuth
            imgSrc: ["'self'", "data:", "https:", "https://accounts.google.com", "https://*.googleusercontent.com"],
            connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com"], // Allow Google OAuth API calls
            fontSrc: ["'self'", "https://accounts.google.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://accounts.google.com"], // Allow Google OAuth iframe/popup
            formAction: ["'self'", "https://accounts.google.com"], // Allow form submissions to Google
        },
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // Allow OAuth redirects
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Import and use routes
const authRateLimiter = isTestEnv
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many authentication attempts. Please try again later.' },
    });

app.use('/auth', authRoutes); // Auth pages (login, register, etc.)
app.use('/api/auth', authRateLimiter, authRoutes); // Auth API endpoints with rate limiting
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api', apiRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Handle GET requests to API endpoints (redirect to appropriate pages)
// Note: POST requests to these endpoints work normally for form submissions
app.get('/api/auth/login', (req, res) => {
    res.redirect('/auth/login');
});
app.get('/api/auth/register', (req, res) => {
    res.redirect('/auth/register');
});
app.get('/api/auth/forgot-password', (req, res) => {
    res.redirect('/auth/forgot-password');
});

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Page routes
app.get('/', optionalAuth, PageController.renderHome);
app.get('/about', optionalAuth, PageController.renderAbout);
app.get('/account', requireAuth, PageController.renderAccountAdministration);
app.get('/profile/manage', requireAuth, PageController.renderProfileManager);
app.get('/profiles/:slug', optionalAuth, ProfileController.renderPublicProfile);

// Dashboard route (protected)
app.get('/dashboard', requireAuth, DashboardController.renderDashboard);

// Specific handler for CORS rejections
app.use((err, req, res, next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
    }
    return next(err);
});

// 404 handler for undefined routes
app.use((req, res) => {
    // Return JSON for API routes, otherwise send HTML
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'Route not found' });
    } else {
        res.status(404).send('Page not found');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});

module.exports = app;



