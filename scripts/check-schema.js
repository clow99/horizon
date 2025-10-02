import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    console.log('=== DATABASE SCHEMA CHECK ===\n');

    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables in database:');
    tables.forEach(row => {
      console.log('  -', Object.values(row)[0]);
    });

    // Check projects table structure
    console.log('\n📊 Projects table structure:');
    const [columns] = await connection.execute('DESCRIBE projects');
    console.table(columns);

    // Check if there are any projects
    const [projects] = await connection.execute('SELECT COUNT(*) as count FROM projects');
    console.log('\n📦 Projects count:', projects[0].count);

    // Check users table
    console.log('\n👥 Users table structure:');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.table(userColumns);

    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('\n👤 Users count:', users[0].count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkSchema();
