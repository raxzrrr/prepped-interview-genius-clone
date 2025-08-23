-- Add was_granted column to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN was_granted BOOLEAN DEFAULT false;

-- Update existing records to have was_granted = false (they were all purchased)
UPDATE public.user_subscriptions 
SET was_granted = false 
WHERE was_granted IS NULL;