const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const path = require('path');
const apiRoutes = require('./routes/api');
const accountRoutes = require('./routes/account');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

// Import and use routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/accounts', accountRoutes);

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    try {
        res.render('index', { title: 'Home Page' });
    } catch (err) {
        console.error('Error rendering home page:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/about', (req, res) => {
    res.render('about', { title: 'About Page' });
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



