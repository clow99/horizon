import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

async function migrate() {
  console.log('Starting migration: Adding user_id to projects table...\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    console.log('Connected to database');

    // Check if users table exists
    const [usersTables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );

    if (usersTables.length === 0) {
      console.log('\n✓ Creating users table...');
      await connection.execute(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        )
      `);
      console.log('✓ Users table created');
    } else {
      console.log('✓ Users table already exists');
    }

    // Check if user_id column exists in projects table
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM projects LIKE 'user_id'"
    );

    if (columns.length === 0) {
      console.log('\n✓ Adding user_id column to projects table...');
      
      // First, add the column as nullable
      await connection.execute(`
        ALTER TABLE projects 
        ADD COLUMN user_id VARCHAR(36) NULL AFTER id
      `);
      console.log('✓ Column added');

      // Create a default user for existing projects
      console.log('\n✓ Creating default user for existing projects...');
      const defaultUserId = 'default-user-' + Date.now();
      await connection.execute(`
        INSERT INTO users (id, email, name) 
        VALUES (?, 'admin@example.com', 'Admin User')
      `, [defaultUserId]);
      console.log('✓ Default user created:', defaultUserId);

      // Update existing projects to use the default user
      console.log('\n✓ Updating existing projects...');
      const [result] = await connection.execute(`
        UPDATE projects SET user_id = ? WHERE user_id IS NULL
      `, [defaultUserId]);
      console.log(`✓ Updated ${result.affectedRows} existing project(s)`);

      // Now make the column NOT NULL
      await connection.execute(`
        ALTER TABLE projects 
        MODIFY COLUMN user_id VARCHAR(36) NOT NULL
      `);
      console.log('✓ Column set to NOT NULL');

      // Add foreign key constraint
      console.log('\n✓ Adding foreign key constraint...');
      await connection.execute(`
        ALTER TABLE projects 
        ADD CONSTRAINT fk_projects_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✓ Foreign key constraint added');

      // Add index
      await connection.execute(`
        ALTER TABLE projects 
        ADD INDEX idx_user_id (user_id)
      `);
      console.log('✓ Index added');

      console.log('\n✅ Migration completed successfully!');
      console.log('\nNote: Existing projects have been assigned to admin@example.com');
      console.log('You can sign in with any Google account and create new projects.');
    } else {
      console.log('\n✓ user_id column already exists in projects table');
      console.log('✅ No migration needed!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('\nDatabase connection closed');
  }
}

migrate()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
