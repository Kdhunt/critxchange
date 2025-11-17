require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 3000;

// In production, use migrations instead of sync
const shouldSync = process.env.NODE_ENV !== 'production';

if (shouldSync) {
  // Development: Auto-sync models
  db.sequelize.sync({ alter: true }).then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });
} else {
  // Production: Just connect (migrations should be run separately)
  db.sequelize.authenticate().then(() => {
    console.log('Database connection established');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
}

