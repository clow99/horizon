-- Migration: Remove required column from tasks table
-- Date: 2025-01-03
-- Description: Removes the required field from tasks table as it's no longer used

USE checklist;

-- Drop index first (if exists)
DROP INDEX IF EXISTS idx_required ON tasks;

-- Remove required column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS required;

-- Show the updated structure
DESCRIBE tasks;
