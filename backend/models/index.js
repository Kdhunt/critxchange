const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
// Default to "development" to avoid requiring test-only dependencies
const env = process.env.NODE_ENV || 'development';
const configPath = path.resolve(__dirname, '..', 'config', 'config.json');

let config = {};
if (fs.existsSync(configPath)) {
  const configs = require(configPath);
  config = configs[env] || {};
}

let sequelize;
if (Object.keys(config).length > 0) {
  if (config.dialect === 'sqlite') {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.storage || ':memory:',
      logging: false
    });
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      logging: false // disable logging; default: console.log
    });
  }
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  });
} else if ((process.env.DB_NAME || process.env.DB_DATABASE) &&
           (process.env.DB_USERNAME || process.env.DB_USER) &&
           process.env.DB_HOST) {
  const database = process.env.DB_NAME || process.env.DB_DATABASE;
  const username = process.env.DB_USERNAME || process.env.DB_USER;
  const password = process.env.DB_PASSWORD || '';
  sequelize = new Sequelize(database, username, password, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  });

} else if (env !== 'production') {
  // Fall back to an in-memory SQLite instance for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false
  });

} else {
  throw new Error(`No configuration found for environment: ${env}`);
}

const db = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
