import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function fixSchema() {
  console.log('🔧 Starting schema fix...\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    // Check current user_id values
    const [projects] = await connection.execute('SELECT id, user_id FROM projects');
    console.log('📦 Current projects:', projects.length);
    
    const projectsWithoutUser = projects.filter(p => !p.user_id);
    console.log('📦 Projects without user_id:', projectsWithoutUser.length);

    if (projectsWithoutUser.length > 0) {
      // Get or create a default user
      let [users] = await connection.execute("SELECT id FROM users LIMIT 1");
      let defaultUserId;

      if (users.length === 0) {
        // Create default user
        defaultUserId = 'default-user-' + Date.now();
        await connection.execute(
          "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
          [defaultUserId, 'admin@example.com', 'Admin User']
        );
        console.log('✓ Created default user:', defaultUserId);
      } else {
        defaultUserId = users[0].id;
        console.log('✓ Using existing user:', defaultUserId);
      }

      // Update projects without user_id
      await connection.execute(
        'UPDATE projects SET user_id = ? WHERE user_id IS NULL',
        [defaultUserId]
      );
      console.log(`✓ Updated ${projectsWithoutUser.length} project(s) with user_id\n`);
    }

    // Now fix the schema
    console.log('🔧 Fixing schema...\n');

    // Drop foreign key if exists
    try {
      await connection.execute('ALTER TABLE projects DROP FOREIGN KEY fk_projects_user_id');
      console.log('✓ Dropped old foreign key');
    } catch (e) {
      console.log('✓ No foreign key to drop');
    }

    // Drop index if exists
    try {
      await connection.execute('ALTER TABLE projects DROP INDEX idx_user_id');
      console.log('✓ Dropped old index');
    } catch (e) {
      console.log('✓ No index to drop');
    }

    // Modify column to correct type and NOT NULL
    await connection.execute(`
      ALTER TABLE projects 
      MODIFY COLUMN user_id VARCHAR(36) NOT NULL
    `);
    console.log('✓ Modified user_id column (VARCHAR(36) NOT NULL)');

    // Add index
    await connection.execute(`
      ALTER TABLE projects 
      ADD INDEX idx_user_id (user_id)
    `);
    console.log('✓ Added index on user_id');

    // Add foreign key
    await connection.execute(`
      ALTER TABLE projects 
      ADD CONSTRAINT fk_projects_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('✓ Added foreign key constraint');

    console.log('\n✅ Schema fixed successfully!\n');

    // Verify the fix
    const [columns] = await connection.execute("SHOW COLUMNS FROM projects WHERE Field = 'user_id'");
    console.log('📊 Updated user_id column:');
    console.table(columns);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSchema()
  .then(() => {
    console.log('🎉 Schema fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  });
