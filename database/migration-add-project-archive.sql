-- Migration: add archived columns to projects table
-- Run this after deploying the code changes. Safe to re-run.

ALTER TABLE projects
  ADD COLUMN archived TINYINT(1) DEFAULT 0 AFTER status;

ALTER TABLE projects
  ADD COLUMN archived_at DATETIME NULL AFTER archived;

ALTER TABLE projects
  ADD INDEX idx_archived (archived);
