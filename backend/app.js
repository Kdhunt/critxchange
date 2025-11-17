const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const apiRoutes = require('./routes/api');
const accountRoutes = require('./routes/account');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const requireAuth = require('./middleware/viewAuth');
const optionalAuth = require('./middleware/optionalAuth');
const cookieParser = require('cookie-parser');

// Initialize passport config
require('./config/passport');

const app = express();

app.use(cors());
app.use(helmet());
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
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Import and use routes
app.use('/auth', authRoutes); // Auth pages (login, register, etc.)
app.use('/api/auth', authRoutes); // Auth API endpoints
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api', apiRoutes);
app.use('/api/accounts', accountRoutes);

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', optionalAuth, (req, res) => {
    try {
        res.render('index', { 
            title: 'Home',
            user: req.user || null
        });
    } catch (err) {
        console.error('Error rendering home page:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/about', optionalAuth, (req, res) => {
    res.render('about', { 
        title: 'About',
        user: req.user || null
    });
});

// Dashboard route (protected)
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.user
        });
    } catch (err) {
        console.error('Error rendering dashboard:', err);
        res.redirect('/auth/login?error=dashboard_error');
    }
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



