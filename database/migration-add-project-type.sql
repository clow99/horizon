-- Migration: Add project_type column to projects table
-- Date: 2025-01-03
-- Description: Adds a column to store the project template type (deployment, website, api, mobile, saas, custom)

USE checklist;

-- Add project_type column to projects table
ALTER TABLE projects 
ADD COLUMN project_type VARCHAR(50) NULL COMMENT 'Project template type (deployment, website, api, mobile, saas, custom)' 
AFTER status;

-- Add index for better query performance
CREATE INDEX idx_project_type ON projects(project_type);

-- Show the updated structure
DESCRIBE projects;
