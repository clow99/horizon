import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (!pool) {
    // Use SQLite for tests
    if (process.env.NODE_ENV === "test") {
      const { getTestDatabase } = require("../../tests/setup/database");
      return getTestDatabase();
    }

    // Use MySQL for development and production
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query(sql, params) {
  // Handle test environment with SQLite
  if (process.env.NODE_ENV === "test") {
    const { executeQuery } = require("../../tests/setup/database");
    return executeQuery(sql, params);
  }

  // Handle production/development with MySQL
  const pool = getPool();
  const [results] = await pool.execute(sql, params);
  return results;
}

// Initialize database tables
export async function initializeTables() {
  const pool = getPool();

  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        image TEXT,
        google_sub VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    // Create projects table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        client VARCHAR(255),
        target_date DATE,
        status VARCHAR(50) DEFAULT 'Planning',
        archived TINYINT(1) DEFAULT 0,
        archived_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_archived (archived),
        INDEX idx_status (status)
      )
    `);

    // Backfill archived columns for existing installations
    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD COLUMN archived TINYINT(1) DEFAULT 0
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD COLUMN archived_at DATETIME NULL AFTER archived
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD INDEX idx_archived (archived)
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_KEYNAME") {
        throw error;
      }
    }

    // Add project_type column for existing installations
    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD COLUMN project_type VARCHAR(50) NULL AFTER status
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD INDEX idx_project_type (project_type)
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_KEYNAME") {
        throw error;
      }
    }

    // Add display_order column for custom project ordering
    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD COLUMN display_order INT NULL AFTER project_type
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE projects
        ADD INDEX idx_display_order (display_order)
      `);
    } catch (error) {
      if (error.code !== "ER_DUP_KEYNAME") {
        throw error;
      }
    }

    // Create tasks table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Not Started',
        notes TEXT,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_project_id (project_id),
        INDEX idx_category (category),
        INDEX idx_status (status)
      )
    `);

    // Remove required column if it exists (migration for existing installations)
    try {
      await pool.execute(`
        ALTER TABLE tasks DROP COLUMN IF EXISTS required
      `);
    } catch (error) {
      // Ignore if column doesn't exist
      if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log("Note: required column may not exist (this is fine)");
      }
    }

    console.log("Database tables initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database tables:", error);
    throw error;
  }
}
