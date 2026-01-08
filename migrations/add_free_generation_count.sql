-- Add free_generation_count column to users table
-- This column tracks the number of free content generations used by each user

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS free_generation_count INTEGER DEFAULT 0;

-- Update existing users to have 0 free generation count
UPDATE users 
SET free_generation_count = 0 
WHERE free_generation_count IS NULL;
