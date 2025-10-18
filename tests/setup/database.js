import Database from "better-sqlite3";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let db = null;
let seedCounter = 0;

/**
 * Get or create in-memory SQLite database for testing
 */
export function getTestDatabase() {
  if (!db) {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

/**
 * Reset database - close and recreate fresh instance
 */
export function resetTestDatabase() {
  if (db) {
    try {
      db.close();
    } catch (error) {
      // Ignore close errors
    }
    db = null;
  }
  return getTestDatabase();
}

/**
 * Reset deterministic seed counter
 */
function resetSeedCounter() {
  seedCounter = 0;
}

/**
 * Close the test database connection
 */
export function closeTestDatabase() {
  if (db) {
    try {
      db.close();
    } catch (error) {
      // Ignore close errors
    }
    db = null;
  }
}

/**
 * Initialize SQLite schema from MySQL schema file
 */
function initializeSchema() {
  const sqliteSchemaPath = join(process.cwd(), "database", "schema.sqlite.sql");
  const schemaPath = join(process.cwd(), "database", "schema.sql");
  const schemaSource = existsSync(sqliteSchemaPath)
    ? readFileSync(sqliteSchemaPath, "utf8")
    : convertMySQLToSQLite(readFileSync(schemaPath, "utf8"));

  // Execute schema
  const statements = schemaSource
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt && !stmt.startsWith("--") && !stmt.startsWith("/*"));

  for (const statement of statements) {
    if (statement) {
      try {
        db.exec(statement);
      } catch (error) {
        // Skip statements that don't apply to SQLite (SHOW, USE, etc.)
        if (
          !error.message.includes('near "SHOW"') &&
          !error.message.includes('near "USE"') &&
          !error.message.includes('near "DESCRIBE"')
        ) {
          console.warn("Schema execution warning:", error.message);
        }
      }
    }
  }
}

function nextSeedId(prefix) {
  seedCounter += 1;
  return `${prefix}-${seedCounter.toString().padStart(4, "0")}`;
}

function seedTimestamp(offset = 0) {
  const base = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
  const date = new Date(base + offset * 60000);
  return date.toISOString();
}

/**
 * Convert MySQL DDL to SQLite-compatible DDL
 */
function convertMySQLToSQLite(mysqlSchema) {
  let sqliteSchema = mysqlSchema;

  // Remove MySQL-specific commands
  sqliteSchema = sqliteSchema.replace(/USE\s+\w+;/gi, "");
  sqliteSchema = sqliteSchema.replace(/SHOW\s+.*?;/gi, "");
  sqliteSchema = sqliteSchema.replace(/DESCRIBE\s+.*?;/gi, "");

  // Remove engine and charset specifications
  sqliteSchema = sqliteSchema.replace(/ENGINE\s*=\s*\w+/gi, "");
  sqliteSchema = sqliteSchema.replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, "");
  sqliteSchema = sqliteSchema.replace(/COLLATE\s*=?\s*\w+/gi, "");

  // Remove comments
  sqliteSchema = sqliteSchema.replace(/\/\*[\s\S]*?\*\//g, "");
  sqliteSchema = sqliteSchema.replace(/COMMENT\s+'[^']*'/gi, "");
  sqliteSchema = sqliteSchema.replace(/COMMENT\s+"[^"]*"/gi, "");

  // Convert AUTO_INCREMENT to AUTOINCREMENT
  sqliteSchema = sqliteSchema.replace(/AUTO_INCREMENT/gi, "AUTOINCREMENT");

  // Convert data types
  sqliteSchema = sqliteSchema.replace(/TINYINT\(1\)/gi, "INTEGER");
  sqliteSchema = sqliteSchema.replace(/BOOLEAN/gi, "INTEGER");
  sqliteSchema = sqliteSchema.replace(/DATETIME/gi, "TEXT");
  sqliteSchema = sqliteSchema.replace(/TIMESTAMP/gi, "TEXT");
  sqliteSchema = sqliteSchema.replace(/DATE/gi, "TEXT");

  // Remove TIMESTAMP default clauses that SQLite doesn't support
  sqliteSchema = sqliteSchema.replace(
    /DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi,
    ""
  );
  sqliteSchema = sqliteSchema.replace(
    /DEFAULT\s+CURRENT_TIMESTAMP/gi,
    "DEFAULT (datetime('now'))"
  );

  // Convert VARCHAR to TEXT (SQLite treats them the same)
  sqliteSchema = sqliteSchema.replace(/VARCHAR\(\d+\)/gi, "TEXT");

  // Handle FOREIGN KEY constraints
  sqliteSchema = sqliteSchema.replace(
    /ON\s+DELETE\s+CASCADE\s+ON\s+UPDATE\s+CASCADE/gi,
    "ON DELETE CASCADE"
  );
  sqliteSchema = sqliteSchema.replace(
    /ON\s+DELETE\s+SET\s+NULL\s+ON\s+UPDATE\s+CASCADE/gi,
    "ON DELETE SET NULL"
  );

  // Remove INDEX definitions (recreate them separately if needed)
  // SQLite supports CREATE INDEX separately
  sqliteSchema = sqliteSchema.replace(/,?\s*INDEX\s+\w+\s*\([^)]+\)/gi, "");

  return sqliteSchema;
}

/**
 * Execute a query and return results (similar to mysql2 interface)
 */
export function executeQuery(sql, params = []) {
  const db = getTestDatabase();

  // Check if it's a SELECT query
  const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

  if (isSelect) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } else {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { insertId: result.lastInsertRowid, affectedRows: result.changes };
  }
}

/**
 * Insert test data helper
 */
export function insertTestData(table, data) {
  const db = getTestDatabase();
  const columns = Object.keys(data);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  return stmt.run(...Object.values(data));
}

/**
 * Clear all tables
 */
export function clearAllTables() {
  const db = getTestDatabase();
  db.exec("DELETE FROM tasks");
  db.exec("DELETE FROM projects");
  db.exec("DELETE FROM users");
  resetSeedCounter();
}

/**
 * Truncate provided tables (defaults to all)
 */
export function truncateTables(tables = ["tasks", "projects", "users"]) {
  const db = getTestDatabase();
  tables.forEach((table) => {
    db.exec(`DELETE FROM ${table}`);
  });
  resetSeedCounter();
}

/**
 * Seed deterministic user row and return inserted record
 */
export function seedUser(overrides = {}) {
  const id = overrides.id || nextSeedId("user");
  const createdAt = overrides.created_at || seedTimestamp(seedCounter);
  const user = {
    id,
    email: overrides.email || `${id}@example.com`,
    name: overrides.name || `Seed ${id}`,
    image: overrides.image || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };

  insertTestData("users", user);
  return user;
}

/**
 * Seed deterministic project row (creates user if missing)
 */
export function seedProject(overrides = {}) {
  const userId = overrides.user_id || seedUser().id;
  const id = overrides.id || nextSeedId("project");
  const createdAt = overrides.created_at || seedTimestamp(seedCounter);
  const project = {
    id,
    user_id: userId,
    name: overrides.name || `Seed Project ${id}`,
    description: overrides.description || "Seed project description",
    client: overrides.client || "Seed Client",
    target_date: overrides.target_date || "2025-12-31",
    status: overrides.status || "Planning",
    archived: overrides.archived ?? 0,
    archived_at: overrides.archived_at || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };

  insertTestData("projects", project);
  return project;
}

/**
 * Seed deterministic task row (creates project if missing)
 */
export function seedTask(overrides = {}) {
  const projectId = overrides.project_id || seedProject().id;
  const id = overrides.id || nextSeedId("task");
  const createdAt = overrides.created_at || seedTimestamp(seedCounter);
  const task = {
    id,
    project_id: projectId,
    name: overrides.name || `Seed Task ${id}`,
    category: overrides.category || "Infrastructure",
    status: overrides.status || "Not Started",
    required: overrides.required ?? 1,
    notes: overrides.notes || "",
    completed_at: overrides.completed_at || null,
    updated_by_user_id: overrides.updated_by_user_id || null,
    updated_by_user_name: overrides.updated_by_user_name || null,
    updated_by_user_image: overrides.updated_by_user_image || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
    ...overrides,
  };

  insertTestData("tasks", task);
  return task;
}
