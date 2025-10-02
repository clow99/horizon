-- Migration: Add User Tracking to Tasks
-- Run this SQL in your MySQL client to add profile picture tracking

USE checklist;

-- Add the three new columns to track which user last updated each task
ALTER TABLE tasks 
ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at,
ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id,
ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name,
ADD CONSTRAINT fk_tasks_updated_by_user 
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD INDEX idx_updated_by_user_id (updated_by_user_id);

-- Verify the columns were added
SHOW COLUMNS FROM tasks;

-- Check the new columns (should show NULL values for existing tasks)
SELECT id, name, status, updated_by_user_name, updated_by_user_image FROM tasks LIMIT 5;
