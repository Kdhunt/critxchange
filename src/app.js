const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const apiRoutes = require('./routes/api');
const accountRoutes = require('./routes/account');

const app = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

// Import and use routes
app.use('/api', apiRoutes);
app.use('/api/accounts', accountRoutes);

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;



