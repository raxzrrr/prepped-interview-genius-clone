
-- Remove the foreign key constraint that's causing the error
ALTER TABLE public.user_learning DROP CONSTRAINT IF EXISTS user_learning_user_id_fkey;

-- Ensure the user_id column is properly configured for UUID values
ALTER TABLE public.user_learning ALTER COLUMN user_id SET NOT NULL;

-- Add an index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_learning_user_id ON public.user_learning(user_id);
