/**
 * Migration Script: Add Updated By User Tracking to Tasks
 * 
 * This script adds columns to track which user last updated each task:
 * - updated_by_user_id: Foreign key to users table
 * - updated_by_user_name: Cached user name for quick display
 * - updated_by_user_image: Cached user profile image URL
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addUpdatedByTracking() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✓ Connected to database');

    // Check if columns already exist
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM tasks LIKE 'updated_by_user_id'
    `);

    if (columns.length > 0) {
      console.log('✓ Columns already exist, skipping migration');
      return;
    }

    console.log('Adding updated_by tracking columns to tasks table...');

    // Add updated_by_user_id column
    await connection.query(`
      ALTER TABLE tasks 
      ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at
    `);
    console.log('✓ Added updated_by_user_id column');

    // Add updated_by_user_name column
    await connection.query(`
      ALTER TABLE tasks 
      ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id
    `);
    console.log('✓ Added updated_by_user_name column');

    // Add updated_by_user_image column
    await connection.query(`
      ALTER TABLE tasks 
      ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name
    `);
    console.log('✓ Added updated_by_user_image column');

    // Add foreign key constraint
    await connection.query(`
      ALTER TABLE tasks 
      ADD CONSTRAINT fk_tasks_updated_by_user 
      FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✓ Added foreign key constraint');

    // Add index for better query performance
    await connection.query(`
      ALTER TABLE tasks 
      ADD INDEX idx_updated_by_user_id (updated_by_user_id)
    `);
    console.log('✓ Added index on updated_by_user_id');

    console.log('\n✓ Migration completed successfully!');
    console.log('\nNew columns added:');
    console.log('  - updated_by_user_id: VARCHAR(36) NULL');
    console.log('  - updated_by_user_name: VARCHAR(255) NULL');
    console.log('  - updated_by_user_image: TEXT NULL');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run migration
addUpdatedByTracking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
