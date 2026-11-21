#!/usr/bin/env node

/**
 * Migration runner script
 * Run migrations manually if sequelize-cli is not available
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Get database connection
const env = process.env.NODE_ENV || 'development';
let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: console.log
    });
} else if (process.env.DB_NAME && process.env.DB_USERNAME && process.env.DB_HOST) {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: process.env.DB_DIALECT || 'postgres',
            logging: console.log
        }
    );
} else {
    console.error('Database configuration not found. Please set DATABASE_URL or DB_* environment variables.');
    process.exit(1);
}

// Load and run migrations
async function runMigrations() {
    try {
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js'))
            .sort();

        console.log(`Found ${migrationFiles.length} migration(s)`);

        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migration = require(path.join(migrationsDir, file));
            
            if (migration.up) {
                await migration.up(sequelize.getQueryInterface(), Sequelize);
                console.log(`✓ Completed: ${file}`);
            }
        }

        console.log('All migrations completed successfully!');
        await sequelize.close();
    } catch (error) {
        console.error('Migration failed:', error);
        await sequelize.close();
        process.exit(1);
    }
}

runMigrations();

