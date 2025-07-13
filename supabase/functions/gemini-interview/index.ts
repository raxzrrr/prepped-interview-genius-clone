
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
    
    // Get API key from Supabase secrets (properly secured)
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    console.log('Edge function called with type:', type);
    console.log('API key available:', apiKey ? 'Yes' : 'No');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured. Please contact administrator.',
          details: 'GEMINI_API_KEY must be set in Supabase Edge Function Secrets'
        }),
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
            Format the response as a JSON array of question strings only.
            
            Example format:
            ["What is your experience with...", "How would you handle...", "Describe a time when..."]`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      };
    } else if (type === 'feedback') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { question, answer } = prompt;
      requestBody = {
        contents: [{
          parts: [{
            text: `Question: ${question}\n\nAnswer: ${answer}\n\nProvide detailed feedback on this interview answer. 
            Evaluate the quality, clarity, and completeness of the response. Suggest improvements. 
            Format the response as a JSON object with these properties: 
            "score" (0-100), "strengths" (array of strings), "areas_to_improve" (array of strings), "suggestion" (string).
            
            Example format:
            {
              "score": 75,
              "strengths": ["Clear explanation", "Good examples"],
              "areas_to_improve": ["More specific details needed"],
              "suggestion": "Consider adding more concrete examples..."
            }`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      };
    } else if (type === 'evaluation') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { question, answer } = prompt;
      
      const userAnswer = answer && answer !== 'Question skipped' && answer !== 'No answer provided' 
        ? answer 
        : 'No answer was provided for this question';
      
      requestBody = {
        contents: [{
          parts: [{
            text: `Question: ${question}\n\nUser's Answer: ${userAnswer}\n\nProvide a comprehensive evaluation including:
            1. An ideal/sample answer for this question (KEEP IT CONCISE - 3-4 sentences maximum)
            2. Evaluation criteria for what makes a good answer
            3. Score breakdown (clarity, relevance, depth, examples, overall - each out of 100)
            4. Detailed feedback on the user's answer (or note that no answer was provided)
            
            For the ideal answer, provide a CONCISE, well-structured response that directly answers the question in 3-4 sentences. Focus on the key points without excessive detail.
            
            Format the response as a JSON object with these properties:
            {
              "ideal_answer": "A concise 3-4 sentence sample answer",
              "evaluation_criteria": ["Key criteria for evaluating this type of question"],
              "score_breakdown": {
                "clarity": 0-100,
                "relevance": 0-100,
                "depth": 0-100,
                "examples": 0-100,
                "overall": 0-100
              },
              "feedback": "Detailed feedback on the user's specific answer"
            }`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      };
    } else if (type === 'resume-analysis') {
      url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const { resume } = prompt;
      
      try {
        // Extract the base64 data only - handle various formats
        let base64Data = resume;
        if (resume.includes('base64,')) {
          base64Data = resume.split('base64,')[1];
        } else if (resume.startsWith('data:')) {
          base64Data = resume.replace(/^data:application\/pdf;base64,/, '');
        }
        
        requestBody = {
          contents: [{
            parts: [
              { 
                text: `Analyze this resume and provide insights. Extract key skills, suggest suitable job roles, and provide constructive feedback. 
                Format the response as a JSON object with these properties: 
                {
                  "skills": ["skill1", "skill2", ...],
                  "suggested_role": "Most suitable job role",
                  "strengths": ["strength1", "strength2", ...],
                  "areas_to_improve": ["area1", "area2", ...],
                  "suggestions": "Overall suggestions for improvement"
                }` 
              },
              { inline_data: { mime_type: "application/pdf", data: base64Data } }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        };
      } catch (error) {
        console.error('Error processing resume data:', error);
        throw new Error('Invalid resume format');
      }
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

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(errorData.error?.message || `API error status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');
    
    // Extract the response text
    let result;
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON from the response
      try {
        console.log('Attempting to parse JSON from response');
        // Clean up the response text to extract valid JSON
        const cleanedText = text.replace(/```json|```/g, '').trim();
        // Handle cases where the response might have extra text before/after JSON
        const jsonMatch = cleanedText.match(/\[.*\]|\{.*\}/s);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanedText;
        
        result = JSON.parse(jsonString);
        console.log('JSON parsed successfully');
      } catch (e) {
        console.error('JSON parsing failed:', e);
        console.log('Raw response text:', text);
        
        // For interview questions, try to extract questions from plain text
        if (type === 'interview-questions') {
          const questions = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && (line.match(/^\d+\./) || line.includes('?')))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .slice(0, 15);
          
          if (questions.length > 0) {
            result = questions;
          } else {
            result = { text };
          }
        } else {
          result = { text };
        }
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
