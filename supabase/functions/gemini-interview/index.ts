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
    
    const { 
      type, 
      prompt, 
      jobRole, 
      questionCount, 
      interviewType, 
      questions, 
      answers, 
      idealAnswers,
      question,
      answer 
    } = requestData
    
    // Get API key from admin profile in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }
    
    // Create Supabase client to get API key from admin profile
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('gemini_api_key')
      .single()
    
    if (adminError || !adminData?.gemini_api_key) {
      console.error('Gemini API key not found in admin profile:', adminError)
      throw new Error('Gemini API key not configured. Please set it in admin settings.')
    }
    
    const apiKey = adminData.gemini_api_key
    console.log('Gemini API key loaded from admin profile')

    console.log('Request type:', type)
    
    let response: Response
    
    switch (type) {
      case 'resume-analysis':
        response = await analyzeResume(prompt?.resumeText, apiKey)
        break
      case 'bulk-evaluation':
        response = await bulkEvaluateAnswers(questions, answers, idealAnswers, apiKey, prompt?.resumeText)
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

// Enhanced resume analysis with parsed text
async function analyzeResume(resumeText: string, apiKey: string) {
  console.log('Analyzing resume...')
  console.log('Resume text length:', resumeText?.length || 0)
  
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('No resume text provided for analysis')
  }

  const prompt = `Analyze the following resume and provide a comprehensive assessment.

RESUME CONTENT:
${resumeText}

Return JSON in this exact format:
{
  "analysis": {
    "skills": ["Array of technical and professional skills found"],
    "suggested_role": "Most suitable job role based on experience",
    "strengths": ["Key strengths from resume"],
    "areas_to_improve": ["Specific areas to enhance"],
    "suggestions": "Detailed actionable advice",
    "job_openings": [
      {
        "role": "Matching role 1",
        "locations": ["Bangalore", "Hyderabad", "Delhi", "Mumbai", "Pune", "Remote"],
        "global": ["USA", "Germany", "Singapore"]
      }
    ]
  },
  "questions": [
    "Question 1 specific to resume content",
    "Question 2 based on skills mentioned",
    "At least 10 total questions"
  ],
  "ideal_answers": [
    "Ideal answer 1 based on background",
    "Ideal answer 2 leveraging experience"
  ]
}`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content generated from resume analysis')
  }

  try {
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    }
    
    const result = JSON.parse(cleanContent)
    
    if (result.analysis && result.questions && result.ideal_answers) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw new Error('Invalid JSON structure')
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    
    // Fallback response
    const fallbackResult = {
      analysis: {
        skills: ['Problem Solving', 'Communication', 'Technical Skills'],
        suggested_role: 'Professional',
        strengths: ['Professional experience', 'Diverse background'],
        areas_to_improve: ['Quantifiable achievements', 'Technical depth'],
        suggestions: 'Focus on highlighting specific achievements with measurable impact.',
        job_openings: [{
          role: 'Software Developer',
          locations: ['Bangalore', 'Hyderabad', 'Delhi', 'Mumbai', 'Pune', 'Remote'],
          global: ['USA', 'Germany', 'Singapore']
        }]
      },
      questions: [
        'Tell me about your professional background.',
        'What are your key technical skills?',
        'Describe a challenging project you worked on.',
        'How do you handle working under pressure?',
        'Where do you see yourself in 5 years?'
      ],
      ideal_answers: [
        'A comprehensive answer highlighting relevant experience and achievements.',
        'A detailed response with specific technical expertise examples.',
        'A structured STAR method answer with measurable results.',
        'A thoughtful response showing stress management skills.',
        'An ambitious yet realistic career growth plan.'
      ]
    }
    
    return new Response(JSON.stringify(fallbackResult), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Bulk evaluate answers with resume context
async function bulkEvaluateAnswers(
  questions: string[], 
  userAnswers: string[], 
  idealAnswers: string[], 
  apiKey: string,
  resumeText?: string
) {
  console.log('Bulk evaluating answers with resume context:', !!resumeText)
  
  const evaluationPrompt = `Evaluate each user answer against the ideal answer using 4 metrics (0-10):
1. CORRECTNESS - How accurate compared to ideal
2. COMPLETENESS - Coverage of ideal answer points  
3. DEPTH - Detail level compared to ideal
4. CLARITY - Structure and communication quality

${resumeText ? `RESUME CONTEXT:\n${resumeText.substring(0, 1000)}...\n` : ''}

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Ideal: ${idealAnswers[i] || 'Professional response expected'}
User: ${userAnswers[i] || 'No answer provided'}
`).join('\n')}

Return JSON with evaluations array and overall_statistics.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: evaluationPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No evaluation content generated')
  }

  try {
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    }
    
    const evaluation = JSON.parse(cleanContent)
    return new Response(JSON.stringify(evaluation), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (parseError) {
    console.error('Evaluation parse error:', parseError)
    
    // Dynamic fallback evaluation
    const fallbackEvaluations = questions.map((q, i) => {
      const hasAnswer = userAnswers[i] && userAnswers[i] !== 'No answer provided'
      const baseScore = hasAnswer ? Math.floor(Math.random() * 3) + 4 : 2
      
      return {
        question_number: i + 1,
        user_answer: userAnswers[i] || 'No answer provided',
        ideal_answer: idealAnswers[i] || 'Professional response expected',
        score: baseScore + (Math.random() * 2 - 1), // Add some variance
        remarks: hasAnswer ? 'Answer provided but could be more detailed' : 'Question skipped',
        score_breakdown: {
          correctness: baseScore,
          completeness: hasAnswer ? baseScore - 1 : 1,
          depth: hasAnswer ? baseScore + 1 : 1,
          clarity: hasAnswer ? baseScore : 2
        },
        improvement_tips: ['Use STAR method', 'Include specific examples']
      }
    })
    
    const avgScore = fallbackEvaluations.reduce((sum, e) => sum + e.score, 0) / fallbackEvaluations.length
    
    return new Response(JSON.stringify({
      evaluations: fallbackEvaluations,
      overall_statistics: {
        average_score: Math.round(avgScore * 10) / 10,
        total_questions: questions.length,
        strengths: ['Participated in interview'],
        areas_to_improve: ['More detailed responses', 'Specific examples'],
        overall_grade: avgScore >= 7 ? 'B+' : avgScore >= 5 ? 'B' : 'C',
        recommendation: 'Practice structured responses with specific examples'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}