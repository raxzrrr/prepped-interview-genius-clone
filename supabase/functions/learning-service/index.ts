
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

Deno.serve(async (req) => {
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
    
    if (!clerkUserId) {
      throw new Error('Clerk user ID is required');
    }

    // Convert Clerk user ID to consistent UUID
    const generateConsistentUUID = (userId: string): string => {
      const crypto = globalThis.crypto;
      const encoder = new TextEncoder();
      const data = encoder.encode(userId + '1b671a64-40d5-491e-99b0-da01ff1f3341');
      
      return crypto.randomUUID();
    };

    const supabaseUserId = generateConsistentUUID(clerkUserId);
    console.log('Processing request for Clerk user:', clerkUserId, 'as UUID:', supabaseUserId);

    let result;

    switch (action) {
      case 'fetch':
        const { data: existingData, error: fetchError } = await supabase
          .from('user_learning')
          .select('*')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        if (!existingData && totalModules) {
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

          if (createError) throw createError;
          result = createdData;
        } else {
          result = existingData;
        }
        break;

      case 'create':
        const { data: createData, error: createError } = await supabase
          .from('user_learning')
          .insert({
            user_id: supabaseUserId,
            ...data
          })
          .select('*')
          .single();
        
        if (createError) throw createError;
        result = createData;
        break;

      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from('user_learning')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', supabaseUserId)
          .select('*')
          .single();
        
        if (updateError) throw updateError;
        result = updateData;
        break;

      case 'updateAssessment':
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
        
        if (assessmentError) throw assessmentError;
        result = assessmentData;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

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
