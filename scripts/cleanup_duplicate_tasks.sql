-- FocusPilot: Clean up duplicate tasks
-- This script identifies and removes duplicate tasks based on similar titles, same goal, and same date

-- First, let's see what duplicates exist
WITH duplicate_tasks AS (
  SELECT 
    t1.id as task_id,
    t1.title,
    t1.goal_id,
    t1.due_date,
    t1.created_at,
    COUNT(*) OVER (
      PARTITION BY 
        t1.goal_id,
        t1.due_date,
        LOWER(REGEXP_REPLACE(t1.title, '[^\w\s]', '', 'g'))
    ) as duplicate_count,
    ROW_NUMBER() OVER (
      PARTITION BY 
        t1.goal_id,
        t1.due_date,
        LOWER(REGEXP_REPLACE(t1.title, '[^\w\s]', '', 'g'))
      ORDER BY t1.created_at ASC
    ) as row_num
  FROM tasks t1
  WHERE t1.user_id IS NOT NULL
)
SELECT 
  task_id,
  title,
  goal_id,
  due_date,
  created_at,
  duplicate_count,
  CASE 
    WHEN row_num = 1 THEN 'KEEP'
    ELSE 'DELETE'
  END as action
FROM duplicate_tasks 
WHERE duplicate_count > 1
ORDER BY goal_id, due_date, created_at;

-- Uncomment the following lines to actually delete duplicates (CAREFUL!)
-- This keeps the oldest task for each duplicate group and removes the rest

/*
WITH duplicate_tasks AS (
  SELECT 
    t1.id as task_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        t1.goal_id,
        t1.due_date,
        LOWER(REGEXP_REPLACE(t1.title, '[^\w\s]', '', 'g'))
      ORDER BY t1.created_at ASC
    ) as row_num
  FROM tasks t1
  WHERE t1.user_id IS NOT NULL
)
DELETE FROM tasks 
WHERE id IN (
  SELECT task_id 
  FROM duplicate_tasks 
  WHERE row_num > 1
);
*/

-- Alternative: More conservative approach - only delete exact title matches
/*
WITH exact_duplicates AS (
  SELECT 
    t1.id as task_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        t1.goal_id,
        t1.due_date,
        t1.title
      ORDER BY t1.created_at ASC
    ) as row_num
  FROM tasks t1
  WHERE t1.user_id IS NOT NULL
)
DELETE FROM tasks 
WHERE id IN (
  SELECT task_id 
  FROM exact_duplicates 
  WHERE row_num > 1
);
*/ 