-- First, let's create a security definer function to handle Clerk user mapping
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS UUID AS $$
DECLARE
    clerk_user_id TEXT;
    mapped_uuid UUID;
BEGIN
    -- Get the Clerk user ID from the JWT claims
    clerk_user_id := (current_setting('request.jwt.claims', true)::json ->> 'sub');
    
    -- If no clerk user ID, return null
    IF clerk_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Generate the same consistent UUID that the frontend generates
    -- This matches the generateConsistentUUID function in the frontend
    mapped_uuid := uuid_generate_v5(
        '00000000-0000-0000-0000-000000000000'::uuid,
        clerk_user_id
    );
    
    RETURN mapped_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies for interview_sessions
DROP POLICY IF EXISTS "Users can create their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can update their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can delete their own interview sessions" ON public.interview_sessions;

-- Create new policies that work with Clerk integration
CREATE POLICY "Users can create their own interview sessions" 
ON public.interview_sessions 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

CREATE POLICY "Users can update their own interview sessions" 
ON public.interview_sessions 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

CREATE POLICY "Users can view their own interview sessions" 
ON public.interview_sessions 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

CREATE POLICY "Users can delete their own interview sessions" 
ON public.interview_sessions 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

-- Also update user_interview_usage policies to work with Clerk
DROP POLICY IF EXISTS "Users can insert their own interview usage" ON public.user_interview_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_interview_usage;
DROP POLICY IF EXISTS "Users can select their own usage" ON public.user_interview_usage;
DROP POLICY IF EXISTS "Users can update their own interview usage" ON public.user_interview_usage;
DROP POLICY IF EXISTS "Users can view their own interview usage" ON public.user_interview_usage;

CREATE POLICY "Users can manage their own interview usage" 
ON public.user_interview_usage 
FOR ALL
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

-- Update user_learning policies
DROP POLICY IF EXISTS "Users can view their own learning data" ON public.user_learning;
DROP POLICY IF EXISTS "Users can insert their own learning data" ON public.user_learning;
DROP POLICY IF EXISTS "Users can update their own learning data" ON public.user_learning;

CREATE POLICY "Users can manage their own learning data" 
ON public.user_learning 
FOR ALL
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);

-- Update interview_reports policies
DROP POLICY IF EXISTS "Users can insert their own interview reports" ON public.interview_reports;
DROP POLICY IF EXISTS "Users can update their own interview reports" ON public.interview_reports;
DROP POLICY IF EXISTS "Users can view their own interview reports" ON public.interview_reports;
DROP POLICY IF EXISTS "Users can delete their own interview reports" ON public.interview_reports;

CREATE POLICY "Users can manage their own interview reports" 
ON public.interview_reports 
FOR ALL
USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        user_id = public.get_current_clerk_user_id()
    )
);