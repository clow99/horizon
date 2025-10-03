import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function ensureArchivedColumns() {
  console.log('📦 Adding archived columns to projects table (if needed)...');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    try {
      await connection.execute(`
        ALTER TABLE projects
        ADD COLUMN archived TINYINT(1) DEFAULT 0 AFTER status
      `);
      console.log('✓ Added archived column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('• archived column already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE projects
        ADD COLUMN archived_at DATETIME NULL AFTER archived
      `);
      console.log('✓ Added archived_at column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('• archived_at column already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE projects
        ADD INDEX idx_archived (archived)
      `);
      console.log('✓ Added idx_archived index');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('• idx_archived index already exists');
      } else {
        throw error;
      }
    }

    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM projects WHERE Field IN ('archived', 'archived_at')"
    );
    console.log('\nCurrent archived columns:');
    console.table(columns);

    console.log('\n✅ Archived support ready!');
  } catch (error) {
    console.error('\n❌ Failed to update schema:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

ensureArchivedColumns();
