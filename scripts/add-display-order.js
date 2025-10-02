require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function addDisplayOrderColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'deployment_tracker'
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'projects' 
      AND COLUMN_NAME = 'display_order'
    `, [process.env.MYSQL_DATABASE || process.env.DB_NAME || 'deployment_tracker']);

    if (columns.length > 0) {
      console.log('display_order column already exists');
      return;
    }

    // Add display_order column
    await connection.execute(`
      ALTER TABLE projects 
      ADD COLUMN display_order INT DEFAULT 0 AFTER user_id
    `);
    console.log('✓ Added display_order column to projects table');

    // Set display_order based on existing id order for each user
    await connection.execute(`
      UPDATE projects p
      JOIN (
        SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id ASC) as rn
        FROM projects
      ) ranked ON p.id = ranked.id
      SET p.display_order = ranked.rn - 1
    `);
    console.log('✓ Initialized display_order values for existing projects');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addDisplayOrderColumn();
