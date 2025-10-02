-- Production Deployment Tracker Database Schema
-- MySQL 5.7+ / MariaDB 10.2+

-- Use the database
USE checklist;

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS tasks;
-- DROP TABLE IF EXISTS projects;
-- DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for user',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address',
  name VARCHAR(255) COMMENT 'User full name',
  image TEXT COMMENT 'User profile image URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Users table';

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for project',
  user_id VARCHAR(36) NOT NULL COMMENT 'Reference to user who owns this project',
  name VARCHAR(255) NOT NULL COMMENT 'Project name',
  description TEXT COMMENT 'Project description',
  client VARCHAR(255) COMMENT 'Client or company name',
  target_date DATE COMMENT 'Target deployment date',
  status VARCHAR(50) DEFAULT 'Planning' COMMENT 'Project status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_target_date (target_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Projects table';

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for task',
  project_id VARCHAR(36) NOT NULL COMMENT 'Reference to parent project',
  name VARCHAR(255) NOT NULL COMMENT 'Task name',
  category VARCHAR(100) COMMENT 'Task category (Infrastructure, Security, etc.)',
  status VARCHAR(50) DEFAULT 'Not Started' COMMENT 'Task status',
  required BOOLEAN DEFAULT false COMMENT 'Is this task required for deployment?',
  notes TEXT COMMENT 'Task notes, links, or assignee info',
  completed_at TIMESTAMP NULL COMMENT 'When the task was completed',
  updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task',
  updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated',
  updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_required (required),
  INDEX idx_updated_by_user_id (updated_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tasks table';

-- Sample data (optional - comment out if you don't want sample data)
/*
INSERT INTO projects (id, name, description, client, target_date, status) VALUES
('sample-project-1', 'Customer Portal App', 'B2B customer management portal', 'Acme Corporation', '2025-10-15', 'Planning'),
('sample-project-2', 'Marketing Website', 'Company marketing site redesign', 'TechStart Inc', '2025-10-20', 'Planning');

INSERT INTO tasks (id, project_id, name, category, status, required) VALUES
('task-1', 'sample-project-1', 'Environment Setup', 'Infrastructure', 'Not Started', true),
('task-2', 'sample-project-1', 'SSL Certificate', 'Security', 'Not Started', true),
('task-3', 'sample-project-1', 'Analytics Integration', 'Monitoring', 'Not Started', true);
*/

-- Verify tables were created
SHOW TABLES;

-- Show table structure
DESCRIBE projects;
DESCRIBE tasks;

-- Show indexes
SHOW INDEX FROM projects;
SHOW INDEX FROM tasks;
