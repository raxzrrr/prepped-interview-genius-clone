
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { prompt, type } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Define the API URL based on the request type
    let url, requestBody;
    
    if (type === 'interview-questions') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      requestBody = {
        contents: [{
          parts: [{
            text: `Generate a list of 15 interview questions for the following job role: ${prompt}. 
            The questions should be challenging and cover both technical and soft skills.
            Format the response as a JSON array of question strings only.`
          }]
        }]
      };
    } else if (type === 'feedback') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { question, answer } = prompt;
      requestBody = {
        contents: [{
          parts: [{
            text: `Question: ${question}\n\nAnswer: ${answer}\n\nProvide detailed feedback on this interview answer. 
            Evaluate the quality, clarity, and completeness of the response. Suggest improvements. Format the response as a JSON object 
            with these properties: "score" (0-100), "strengths" (array of strings), "areas_to_improve" (array of strings), "suggestion" (string).`
          }]
        }]
      };
    } else if (type === 'facial-analysis') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { image } = prompt;
      requestBody = {
        contents: [{
          parts: [
            { text: "Analyze this facial expression during a job interview. What emotions are being expressed? Does the person appear confident, nervous, engaged, or distracted? Provide your analysis as a JSON object with properties: 'primary_emotion', 'confidence_score' (0-100), 'engagement_level' (0-100), 'observations' (array of strings)" },
            { inline_data: { mime_type: "image/jpeg", data: image.replace(/^data:image\/\w+;base64,/, '') } }
          ]
        }]
      };
    } else if (type === 'resume-analysis') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { resume } = prompt;
      requestBody = {
        contents: [{
          parts: [
            { text: "Analyze this resume and provide insights. Note: This resume has been anonymized and contains no personal identifiable information. Extract key skills, suggest suitable job roles, and provide constructive feedback. Format the response as a JSON object with these properties: 'skills' (array of strings), 'suggested_role' (string), 'strengths' (array of strings), 'areas_to_improve' (array of strings), 'suggestions' (string)" },
            { inline_data: { mime_type: "application/pdf", data: resume.replace(/^data:application\/pdf;base64,/, '') } }
          ]
        }]
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Making request to Gemini API for type: ${type}`);
    
    // Make the request to the Gemini API
    const apiUrl = `${url}?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(errorData.error?.message || `API error status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response text
    let result;
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON from the response
      try {
        console.log('Attempting to parse JSON from response');
        result = JSON.parse(text.replace(/```json|```/g, '').trim());
        console.log('JSON parsed successfully');
      } catch (e) {
        console.error('JSON parsing failed:', e);
        // If JSON parsing fails, return the text directly
        result = { text };
      }
    } else if (data.error) {
      console.error('Error in API response:', data.error);
      throw new Error(data.error.message || 'API error');
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
