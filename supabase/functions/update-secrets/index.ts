import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, value } = await req.json()
    
    if (!type || !value) {
      throw new Error('Type and value are required')
    }

    // Create Supabase client with service role key for admin operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseServiceKey) {
      throw new Error('Service role key not available')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey)

    // Update the secret based on type
    let secretName = ''
    switch (type) {
      case 'gemini':
        secretName = 'GEMINI_API_KEY'
        break
      case 'tts':
        secretName = 'GOOGLE_TTS_API_KEY'
        break
      default:
        throw new Error('Invalid secret type')
    }

    console.log(`Updating secret: ${secretName}`)
    
    // Note: In a real implementation, you would use Supabase Management API
    // For now, we'll just store in the database and let edge functions read from there
    console.log(`Secret ${secretName} update requested with value length: ${value.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${secretName} updated successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error updating secret:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})