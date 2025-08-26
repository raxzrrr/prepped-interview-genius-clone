import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get Gemini API key from admin credentials
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('admin_credentials')
      .select('gemini_api_key')
      .single();

    if (adminError || !adminProfile?.gemini_api_key) {
      console.error('Gemini API key not found:', adminError);
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { roles, locations } = await req.json();
    
    const prompt = `You are a job search assistant. Generate a list of 8-12 REAL current job openings based on the following criteria:

Roles: ${roles.join(', ')}
Locations: ${locations.join(', ')}

For each job, provide:
- Job title (specific to the role)
- Company name (use real company names)
- Location (use the provided locations or "Remote")
- Job description (2-3 sentences about responsibilities)
- Job type (Full-time, Part-time, Contract, Remote)
- Experience level (Entry, Mid, Senior)
- Salary range (realistic for the role and location)
- Application URL (use format: https://careers.company.com/jobs/job-id)

Return the response as a JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "title": "job title",
    "company": "company name",
    "location": "location",
    "description": "job description",
    "url": "application url",
    "type": "job type",
    "posted": "time posted (e.g., '2 days ago')",
    "experience": "experience level",
    "salary": "salary range"
  }
]

Focus on current market trends and realistic job postings that would actually exist for these roles in these locations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${adminProfile.gemini_api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    // Extract JSON from the response
    let jobListings;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jobListings = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Return fallback structure if parsing fails
      jobListings = [{
        id: 'fallback-1',
        title: `${roles[0] || 'Software Engineer'}`,
        company: 'Tech Company',
        location: locations[0] || 'Remote',
        description: 'Exciting opportunity to work with cutting-edge technologies and contribute to innovative projects.',
        url: 'https://careers.example.com/jobs/1',
        type: 'Full-time',
        posted: '1 day ago',
        experience: 'Mid-level',
        salary: '$70,000 - $100,000'
      }];
    }

    return new Response(JSON.stringify({ jobs: jobListings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-job-search function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});