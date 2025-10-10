-- Fix completed_readings.user_id Foreign Key to add CASCADE DELETE
-- This ensures that when a user is deleted, their completed readings are also deleted

BEGIN;

-- Step 1: Drop the existing FK constraint
ALTER TABLE completed_readings
DROP CONSTRAINT IF EXISTS completed_readings_user_id_fkey;

-- Step 2: Re-add the FK constraint with CASCADE DELETE
ALTER TABLE completed_readings
ADD CONSTRAINT completed_readings_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- Verify the change
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'completed_readings'
AND kcu.column_name = 'user_id';

COMMIT;
