
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
    console.log('TTS API key available:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      console.error('GOOGLE_TTS_API_KEY not found in Supabase secrets');
      throw new Error('TTS API key not configured. Please add GOOGLE_TTS_API_KEY in your Supabase dashboard under Project Settings > Edge Function Secrets.');
    }

    // Generate speech from text using the Google TTS API
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          ssmlGender: 'NEUTRAL',
          name: voice || 'en-US-Neural2-F',
        },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Google TTS API error:', error);
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ audioContent: result.audioContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
