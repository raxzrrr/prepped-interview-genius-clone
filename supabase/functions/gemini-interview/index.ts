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
      case 'interview-questions':
        response = await generateInterviewQuestions(prompt, apiKey)
        break
      case 'generate-interview-set':
        response = await generateInterviewSet(interviewType, jobRole, questionCount, apiKey, prompt?.resumeBase64)
        break
      case 'generate-hr-technical':
        console.log('Generating HR technical questions with questionCount:', questionCount)
        if (!questionCount) {
          throw new Error('Question count is required for HR technical questions')
        }
        response = await generateHRTechnicalQuestions(questionCount, apiKey)
        break
      case 'bulk-evaluation':
        response = await bulkEvaluateAnswers(questions, answers, idealAnswers, apiKey)
        break
      case 'feedback':
        response = await getAnswerFeedback(question || prompt?.question, answer || prompt?.answer, apiKey)
        break
      case 'evaluation':
        response = await evaluateAnswer(question || prompt?.question, answer || prompt?.answer, apiKey)
        break
      case 'resume-analysis':
        response = await analyzeResume(prompt?.resume, apiKey)
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

// Generate interview question set with ideal answers
async function generateInterviewSet(
  interviewType: string, 
  jobRole: string, 
  questionCount: number, 
  apiKey: string, 
  resumeBase64?: string
) {
  console.log('Generating interview set:', { interviewType, jobRole, questionCount })
  
  let prompt = ''
  
  if (interviewType === 'basic_hr_technical') {
    prompt = `Generate ${questionCount} interview questions that combine HR behavioral questions and basic technical questions suitable for any role.

Focus on:
- HR/Behavioral questions (60%): Communication, teamwork, problem-solving, conflict resolution, leadership
- Basic Technical questions (40%): General technical thinking, problem-solving approach, basic concepts

For each question, also provide an ideal comprehensive answer that would score 9-10/10.

Return the response in this exact JSON format:
{
  "questions": ["Question 1", "Question 2", ...],
  "ideal_answers": ["Ideal answer 1", "Ideal answer 2", ...]
}

Make the questions professional-level and challenging enough for real interview scenarios.`
  } else if (interviewType === 'role_based') {
    prompt = `Generate ${questionCount} specialized interview questions for a ${jobRole} position.

Focus on:
- Role-specific technical skills and expertise (70%)
- Industry-specific behavioral scenarios (30%)
- Real-world challenges faced in this role
- Deep technical knowledge and best practices

For each question, also provide an ideal comprehensive answer that demonstrates expert-level knowledge.

Return the response in this exact JSON format:
{
  "questions": ["Question 1", "Question 2", ...],
  "ideal_answers": ["Ideal answer 1", "Ideal answer 2", ...]
}

Make the questions reflect real industry standards and depth expected for ${jobRole}.`
  } else if (interviewType === 'resume_based') {
    prompt = `Based on the resume provided, generate ${questionCount} highly personalized interview questions.

Focus on:
- Specific experiences and projects mentioned in the resume
- Skills and technologies listed
- Career progression and achievements
- Industry-specific scenarios relevant to their background

For each question, also provide an ideal answer that leverages the candidate's background.

Return the response in this exact JSON format:
{
  "questions": ["Question 1", "Question 2", ...],
  "ideal_answers": ["Ideal answer 1", "Ideal answer 2", ...]
}

Make questions that directly relate to their experience and would challenge them appropriately.`
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        maxOutputTokens: 3000,
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
    const result = JSON.parse(content)
    if (result.questions && result.ideal_answers && Array.isArray(result.questions) && Array.isArray(result.ideal_answers)) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    throw new Error('Invalid JSON format')
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    // Fallback with generic questions
    const fallbackQuestions = [
      "Tell me about yourself and your professional background.",
      "What are your greatest strengths and how do they relate to this role?",
      "Describe a challenging project you worked on and how you handled it.",
      "How do you handle working under pressure and tight deadlines?",
      "Where do you see yourself in the next 5 years?"
    ].slice(0, questionCount)
    
    const fallbackAnswers = [
      "A comprehensive answer highlighting relevant experience, key achievements, and alignment with the role.",
      "A detailed response identifying specific strengths with concrete examples of how they've been applied successfully.",
      "A structured answer using the STAR method describing situation, task, action, and results.",
      "A thoughtful response demonstrating stress management skills and providing specific strategies used.",
      "An ambitious yet realistic answer showing career growth mindset and commitment to the field."
    ].slice(0, questionCount)
    
    return new Response(JSON.stringify({
      questions: fallbackQuestions,
      ideal_answers: fallbackAnswers
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Generate HR and technical questions specifically
async function generateHRTechnicalQuestions(questionCount: number, apiKey: string) {
  return generateInterviewSet('basic_hr_technical', '', questionCount, apiKey, undefined)
}

// Bulk evaluate all answers at once
async function bulkEvaluateAnswers(
  questions: string[], 
  userAnswers: string[], 
  idealAnswers: string[], 
  apiKey: string
) {
  console.log('Bulk evaluating answers')
  
  const evaluationPrompt = `Perform a strict professional evaluation of these interview answers. Compare each user answer with the ideal answer and provide honest, direct feedback.

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Ideal Answer: ${idealAnswers[i] || 'Standard professional response expected'}
User Answer: ${userAnswers[i] || 'No answer provided'}
`).join('\n')}

Evaluation Criteria:
- Correctness (40%): Is the answer factually correct and accurate?
- Completeness (25%): Does it address all parts of the question thoroughly?
- Depth (20%): Shows deep understanding vs surface-level response?
- Clarity (15%): Clear communication and well-structured response?

Scoring Scale:
- 0-3: Poor/Incorrect - Major gaps, wrong information, irrelevant
- 4-6: Below Average - Partially correct, lacks depth or completeness
- 7-8: Good - Mostly correct, could be more comprehensive
- 9-10: Excellent - Comprehensive, accurate, well-structured

Be strict and honest. If an answer is wrong or poor quality, mark it accordingly. This is for professional development.

Return response in this exact JSON format:
{
  "evaluations": [
    {
      "question_number": 1,
      "user_answer": "The actual user answer",
      "ideal_answer": "The expected ideal answer",
      "score": 7,
      "remarks": "Direct feedback on what was good, what was missing, and how to improve",
      "score_breakdown": {
        "correctness": 8,
        "completeness": 6,
        "depth": 7,
        "clarity": 8
      }
    }
  ],
  "overall_statistics": {
    "average_score": 7.2,
    "total_questions": ${questions.length},
    "strengths": ["Clear communication", "Good examples"],
    "areas_for_improvement": ["More technical depth", "Better structure"],
    "overall_grade": "B",
    "recommendation": "Practice more technical scenarios and provide specific examples"
  }
}`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: evaluationPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
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
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    // Fallback evaluation
    const fallbackEvaluations = questions.map((q, i) => ({
      question_number: i + 1,
      user_answer: userAnswers[i] || 'No answer provided',
      ideal_answer: idealAnswers[i] || 'Comprehensive professional response expected',
      score: 5,
      remarks: 'Unable to provide detailed evaluation. Consider providing more specific examples and technical details.',
      score_breakdown: {
        correctness: 5,
        completeness: 5,
        depth: 5,
        clarity: 5
      }
    }))
    
    return new Response(JSON.stringify({
      evaluations: fallbackEvaluations,
      overall_statistics: {
        average_score: 5.0,
        total_questions: questions.length,
        strengths: ["Attempted all questions"],
        areas_for_improvement: ["Provide more detailed responses", "Include specific examples"],
        overall_grade: "C",
        recommendation: "Practice answering questions with more depth and specific examples"
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function generateInterviewQuestions(jobRole: string, apiKey: string) {
  console.log('Generating interview questions for role:', jobRole)
  
  // Updated to use the correct model name
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
