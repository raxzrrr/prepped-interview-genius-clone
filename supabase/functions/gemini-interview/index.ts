
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Gemini interview function called')
    
    const requestData = await req.json()
    console.log('Request data:', requestData)
    
    const { type, prompt, userId } = requestData
    
    if (!userId) {
      console.error('No userId provided in request')
      throw new Error('User ID is required')
    }
    
    console.log('Processing request for user:', userId)

    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user's API key from their profile using the provided userId
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', userId)
      .single()

    console.log('Profile lookup result:', { profile: !!profile, error: profileError })

    if (profileError || !profile?.gemini_api_key) {
      console.error('Gemini API key not found in user profile:', profileError)
      throw new Error('Gemini API key not found in user profile. Please set up your API key in Settings.')
    }

    console.log('Request type:', type)

    // Use the user's API key
    const apiKey = profile.gemini_api_key
    
    let response: Response
    
    switch (type) {
      case 'interview-questions':
        response = await generateInterviewQuestions(prompt, apiKey)
        break
      case 'feedback':
        response = await getAnswerFeedback(prompt.question, prompt.answer, apiKey)
        break
      case 'evaluation':
        response = await evaluateAnswer(prompt.question, prompt.answer, apiKey)
        break
      case 'resume-analysis':
        response = await analyzeResume(prompt.resume, apiKey)
        break
      default:
        throw new Error('Invalid request type')
    }

    const data = await response.json()
    console.log('Successfully processed request')
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error in gemini-interview function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateInterviewQuestions(jobRole: string, apiKey: string) {
  console.log('Generating interview questions for role:', jobRole)
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate 5 technical and behavioral interview questions for a ${jobRole} position. 
                 Focus on practical scenarios and skills assessment.
                 Return only the questions as a JSON array of strings.
                 Example format: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Gemini API error:', response.status, errorData)
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content generated')
  }

  console.log('Generated content:', content)

  try {
    // Try to parse as JSON array
    const questions = JSON.parse(content)
    if (Array.isArray(questions)) {
      return new Response(JSON.stringify(questions), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    throw new Error('Invalid JSON format')
  } catch {
    // Fallback: split by lines and clean up
    const questions = content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter((q: string) => q.length > 10)
      .slice(0, 5) // Ensure we only return 5 questions
    
    console.log('Fallback questions:', questions)
    
    return new Response(JSON.stringify(questions), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function getAnswerFeedback(question: string, answer: string, apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Provide feedback for this interview answer:
                 
                 Question: ${question}
                 Answer: ${answer}
                 
                 Please provide feedback in the following JSON format:
                 {
                   "score": <number between 1-10>,
                   "strengths": ["strength1", "strength2"],
                   "areas_to_improve": ["area1", "area2"],
                   "suggestion": "Specific improvement suggestion"
                 }`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      }
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content generated')
  }

  try {
    const feedback = JSON.parse(content)
    return new Response(JSON.stringify(feedback), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    // Fallback response
    return new Response(JSON.stringify({
      score: 5,
      strengths: ["Provided an answer"],
      areas_to_improve: ["Could be more specific"],
      suggestion: "Try to provide more detailed examples"
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function evaluateAnswer(question: string, answer: string, apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Evaluate this interview question and answer:
                 
                 Question: ${question}
                 Answer: ${answer}
                 
                 Please provide evaluation in the following JSON format:
                 {
                   "ideal_answer": "What would be an ideal answer",
                   "evaluation_criteria": ["criteria1", "criteria2"],
                   "score_breakdown": {
                     "clarity": <1-10>,
                     "relevance": <1-10>,
                     "depth": <1-10>,
                     "examples": <1-10>,
                     "overall": <1-10>
                   },
                   "feedback": "Detailed feedback on the answer"
                 }`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content generated')
  }

  try {
    const evaluation = JSON.parse(content)
    return new Response(JSON.stringify(evaluation), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    // Fallback response
    return new Response(JSON.stringify({
      ideal_answer: "A comprehensive answer addressing the key points",
      evaluation_criteria: ["Clarity", "Relevance", "Examples"],
      score_breakdown: {
        clarity: 5,
        relevance: 5,
        depth: 5,
        examples: 5,
        overall: 5
      },
      feedback: "Consider providing more specific examples and details"
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function analyzeResume(resumeBase64: string, apiKey: string) {
  // For resume analysis, we would need to implement PDF parsing
  // This is a simplified version
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze this resume and provide feedback in the following JSON format:
                 {
                   "skills": ["skill1", "skill2"],
                   "suggested_role": "Suggested job role",
                   "strengths": ["strength1", "strength2"],
                   "areas_to_improve": ["area1", "area2"],
                   "suggestions": "Specific suggestions for improvement"
                 }`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content generated')
  }

  try {
    const analysis = JSON.parse(content)
    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    // Fallback response
    return new Response(JSON.stringify({
      skills: ["Communication", "Problem Solving"],
      suggested_role: "Software Developer",
      strengths: ["Good experience", "Relevant skills"],
      areas_to_improve: ["Add more details", "Include metrics"],
      suggestions: "Consider adding quantifiable achievements"
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
