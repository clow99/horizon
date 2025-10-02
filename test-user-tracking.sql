-- Quick test to see if user tracking columns exist and have data
SELECT 
  id, 
  name, 
  status,
  updated_by_user_id,
  updated_by_user_name,
  updated_by_user_image
FROM tasks 
WHERE updated_by_user_id IS NOT NULL
LIMIT 5;

-- Check column structure
SHOW COLUMNS FROM tasks LIKE 'updated_by_user%';
