const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

// Import and use routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

module.exports = app;