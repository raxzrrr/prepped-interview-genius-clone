
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LearningServiceRequest {
  action: 'create' | 'update' | 'fetch' | 'updateAssessment';
  clerkUserId: string;
  data?: any;
  totalModules?: number;
}

// Fixed UUID generation function that creates consistent UUIDs
const generateConsistentUUID = (userId: string): string => {
  const namespace = '1b671a64-40d5-491e-99b0-da01ff1f3341';
  
  // Simple hash function to create deterministic UUID
  let hash = 0;
  const input = userId + namespace;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to hex and pad to create UUID format
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(0, 3)}-${hex.slice(0, 12).padEnd(12, '0')}`;
};

Deno.serve(async (req) => {
  console.log('Learning service function invoked:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, clerkUserId, data, totalModules }: LearningServiceRequest = await req.json();
    console.log('Request received:', { action, clerkUserId, hasData: !!data, totalModules });
    
    if (!clerkUserId) {
      throw new Error('Clerk user ID is required');
    }

    // Convert Clerk user ID to consistent UUID
    const supabaseUserId = generateConsistentUUID(clerkUserId);
    console.log('Processing request for Clerk user:', clerkUserId, 'as UUID:', supabaseUserId);

    let result;

    switch (action) {
      case 'fetch':
        console.log('Fetching user learning data...');
        
        // Try to find existing record
        const { data: existingData, error: fetchError } = await supabase
          .from('user_learning')
          .select('*')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
        
        if (!existingData && totalModules) {
          console.log('Creating new learning record...');
          // Create new record if none exists
          const newRecord = {
            user_id: supabaseUserId,
            course_progress: {},
            completed_modules: 0,
            total_modules: totalModules,
            assessment_attempted: false,
            assessment_score: null,
            course_score: null,
            course_completed_at: null,
            assessment_completed_at: null
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error:', createError);
            result = null; // Return null for graceful fallback
          } else {
            result = createdData;
            console.log('Created new learning record:', result.id);
          }
        } else {
          result = existingData;
          console.log('Found existing learning record:', result?.id || 'none');
        }
        break;

      case 'update':
        console.log('Updating learning record...');
        
        // First ensure record exists
        const { data: checkData } = await supabase
          .from('user_learning')
          .select('id')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (!checkData) {
          console.log('No existing record found, creating one first...');
          const newRecord = {
            user_id: supabaseUserId,
            course_progress: data.course_progress || {},
            completed_modules: data.completed_modules || 0,
            total_modules: data.total_modules || 0,
            assessment_attempted: false,
            assessment_score: null,
            course_score: data.course_score || null,
            course_completed_at: data.course_completed_at || null,
            assessment_completed_at: null
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error during update:', createError);
            throw createError;
          }
          result = createdData;
          console.log('Created new learning record during update:', result.id);
        } else {
          const { data: updateData, error: updateError } = await supabase
            .from('user_learning')
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', supabaseUserId)
            .select('*')
            .single();
          
          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
          result = updateData;
          console.log('Updated learning record:', result.id);
        }
        break;

      case 'updateAssessment':
        console.log('Updating assessment score...');
        
        // Ensure record exists first
        const { data: assessmentCheckData } = await supabase
          .from('user_learning')
          .select('id')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (!assessmentCheckData) {
          // Create record if it doesn't exist
          const newRecord = {
            user_id: supabaseUserId,
            course_progress: {},
            completed_modules: 0,
            total_modules: 0,
            assessment_attempted: true,
            assessment_score: data.score,
            assessment_completed_at: new Date().toISOString(),
            course_score: null,
            course_completed_at: null
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error during assessment update:', createError);
            throw createError;
          }
          result = createdData;
          console.log('Created new learning record for assessment:', result.id);
        } else {
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('user_learning')
            .update({
              assessment_attempted: true,
              assessment_score: data.score,
              assessment_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', supabaseUserId)
            .select('*')
            .single();
          
          if (assessmentError) {
            console.error('Assessment update error:', assessmentError);
            throw assessmentError;
          }
          result = assessmentData;
          console.log('Updated assessment score:', data.score);
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('Request completed successfully');
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Learning service error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred in the learning service' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
