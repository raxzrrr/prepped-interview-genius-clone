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
    // Clean the response by removing markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(cleanContent)
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

// Bulk evaluate all answers at once - Enhanced version for resume-based interviews
async function bulkEvaluateAnswers(
  questions: string[], 
  userAnswers: string[], 
  idealAnswers: string[], 
  apiKey: string
) {
  console.log('Bulk evaluating answers')
  
  const evaluationPrompt = `You are a professional interview evaluator specializing in comparison-based scoring. Evaluate each user answer by directly comparing it against the provided ideal answer.

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Ideal Answer: ${idealAnswers[i] || 'Standard professional response expected'}
User Answer: ${userAnswers[i] || 'No answer provided'}
`).join('\n')}

EVALUATION METHODOLOGY:
Compare each user answer directly against the corresponding ideal answer using these 4 metrics (0-10 scale):

1. CORRECTNESS (0-10): How factually accurate is the user's answer compared to the ideal?
   - 9-10: Completely accurate, matches ideal answer's facts
   - 7-8: Mostly accurate with minor factual gaps
   - 5-6: Some accuracy but notable factual errors
   - 3-4: Many factual errors or misconceptions
   - 0-2: Completely wrong or irrelevant

2. COMPLETENESS (0-10): How fully does the user's answer address all points in the ideal answer?
   - 9-10: Covers all key points from ideal answer
   - 7-8: Covers most important points, minor gaps
   - 5-6: Covers some points but missing significant content
   - 3-4: Addresses question partially, major gaps
   - 0-2: Minimal coverage or completely incomplete

3. DEPTH (0-10): How detailed and insightful is the answer compared to the ideal?
   - 9-10: Matches or exceeds depth of ideal answer
   - 7-8: Good depth, close to ideal level
   - 5-6: Some depth but lacks detail compared to ideal
   - 3-4: Surface level, much shallower than ideal
   - 0-2: Very superficial or no depth shown

4. CLARITY (0-10): How well-structured and clear is the communication compared to ideal?
   - 9-10: Exceptionally clear, well-organized like ideal
   - 7-8: Clear and well-structured
   - 5-6: Generally clear but some confusion
   - 3-4: Unclear in places, poor structure
   - 0-2: Very unclear, rambling, or incoherent

SCORING GUIDELINES:
- If user skipped/no answer provided: All metrics = 2/10 with feedback on what ideal answer covered
- Scores should vary realistically - avoid defaulting to 5/10
- Provide specific reasoning for each score based on comparison with ideal answer
- Focus on what was CORRECT vs what was MISSING compared to ideal

Return response in this exact JSON format:
{
  "evaluations": [
    {
      "question_number": 1,
      "user_answer": "The actual user answer",
      "ideal_answer": "The provided ideal answer",
      "score": 6.5,
      "remarks": "Direct comparison: What user got right from ideal answer, what was missing, specific gaps identified",
      "score_breakdown": {
        "correctness": 7,
        "completeness": 5,
        "depth": 6,
        "clarity": 8
      },
      "improvement_tips": [
        "Specific tip based on what ideal answer included that user missed",
        "Another specific actionable improvement based on ideal vs actual"
      ]
    }
  ],
  "overall_statistics": {
    "average_score": 6.2,
    "total_questions": ${questions.length},
    "strengths": ["Specific strengths observed in user's answers"],
    "areas_to_improve": ["Specific areas where user fell short of ideal answers"],
    "overall_grade": "B-",
    "recommendation": "Specific practice areas and next steps based on ideal answer comparisons"
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
    // Clean the response by removing markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    const evaluation = JSON.parse(cleanContent)
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
      score: userAnswers[i] && userAnswers[i] !== 'Question skipped' ? 5 : 2,
      remarks: userAnswers[i] && userAnswers[i] !== 'Question skipped' 
        ? 'Answer provided but needs more specific examples and technical details based on ideal answer comparison.'
        : 'Question was skipped. The ideal answer shows what comprehensive coverage should include.',
      score_breakdown: {
        correctness: userAnswers[i] && userAnswers[i] !== 'Question skipped' ? 5 : 2,
        completeness: userAnswers[i] && userAnswers[i] !== 'Question skipped' ? 4 : 1,
        depth: userAnswers[i] && userAnswers[i] !== 'Question skipped' ? 5 : 2,
        clarity: userAnswers[i] && userAnswers[i] !== 'Question skipped' ? 6 : 2
      },
      improvement_tips: [
        "Review the ideal answer and include similar depth and structure",
        "Use the STAR method (Situation, Task, Action, Result) for behavioral questions"
      ]
    }))
    
    const avgScore = fallbackEvaluations.reduce((sum, e) => sum + e.score, 0) / fallbackEvaluations.length
    
    return new Response(JSON.stringify({
      evaluations: fallbackEvaluations,
      overall_statistics: {
        average_score: avgScore,
        total_questions: questions.length,
        strengths: ["Completed the interview process"],
        areas_to_improve: ["Provide more detailed responses", "Include specific examples", "Follow STAR method for behavioral questions"],
        overall_grade: avgScore >= 7 ? "B" : avgScore >= 5 ? "C" : "D",
        recommendation: "Practice answering questions with more depth, specific examples, and structured responses based on ideal answer patterns"
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
    return new Response(JSON.stringify({
      score: 5,
      strengths: ["Attempted to answer the question"],
      areas_to_improve: ["Provide more specific examples"],
      suggestion: "Try to structure your answer and provide concrete examples"
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
          text: `Evaluate this interview answer and provide detailed feedback:
                 
                 Question: ${question}
                 Answer: ${answer}
                 
                 Please provide evaluation in the following JSON format:
                 {
                   "ideal_answer": "What an ideal answer would look like",
                   "evaluation_criteria": ["criteria1", "criteria2"],
                   "score_breakdown": {
                     "clarity": <0-10>,
                     "relevance": <0-10>,
                     "depth": <0-10>,
                     "examples": <0-10>,
                     "overall": <0-10>
                   },
                   "feedback": "Detailed feedback on how to improve"
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
    return new Response(JSON.stringify({
      ideal_answer: "A comprehensive answer with specific examples and clear structure",
      evaluation_criteria: ["Clarity", "Relevance", "Depth", "Examples"],
      score_breakdown: {
        clarity: 5,
        relevance: 5,
        depth: 4,
        examples: 4,
        overall: 4.5
      },
      feedback: "Consider providing more specific examples and structuring your answer clearly"
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function analyzeResume(resumeBase64: string, apiKey: string) {
  console.log('Analyzing resume...')
  
  let prompt = `You are an expert career coach and resume analyzer. Analyze this resume and provide comprehensive career guidance.

Analyze the resume and provide a detailed JSON response with:
1. Skills extraction (technical and soft skills)
2. Suggested role based on experience and skills
3. Strengths and areas to improve
4. Specific suggestions for career enhancement
5. At least 10 interview questions specifically tailored to this candidate's background AND their corresponding ideal answers
6. Relevant job opportunities in multiple Indian and global locations

CRITICAL: Generate questions AND their ideal answers together in this API call.

Return the response in this exact JSON format:
{
  "analysis": {
    "skills": ["skill1", "skill2", ...],
    "suggested_role": "Suggested job role",
    "strengths": ["strength1", "strength2", ...],
    "areas_to_improve": ["area1", "area2", ...],
    "suggestions": "Specific improvement advice",
    "job_openings": [
      {
        "role": "Software Engineer",
        "locations": ["Bangalore", "Hyderabad", "Delhi", "Mumbai", "Pune"],
        "global": ["USA", "Germany", "Singapore", "Canada", "UK"]
      },
      {
        "role": "Senior Developer",
        "locations": ["Chennai", "Pune", "Noida", "Gurugram", "Remote"],
        "global": ["Netherlands", "Australia", "Dubai", "Switzerland"]
      }
    ]
  },
  "questions": [
    "Question 1 specific to resume",
    "Question 2 specific to resume", 
    ...
    "At least 10 questions total"
  ],
  "ideal_answers": [
    "Comprehensive ideal answer for question 1 based on candidate's background",
    "Comprehensive ideal answer for question 2 based on candidate's background",
    ...
    "Ideal answers for all questions"
  ]
}

IMPORTANT:
- Include at least 5 Indian cities per job role
- Include 3-5 global locations per job role  
- Generate minimum 3 different job roles with locations
- Make questions highly specific to the candidate's resume - reference their projects, skills, technologies, and achievements directly
- Provide ideal answers that leverage the candidate's actual background and experience`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt,
          inline_data: {
            mime_type: 'application/pdf',
            data: resumeBase64.split(',')[1] // Remove data:application/pdf;base64, prefix
          }
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
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

  console.log('Generated resume analysis content:', content)

  try {
    // Clean the response by removing markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(cleanContent)
    
    // Validate the structure
    if (result.analysis && result.questions && result.ideal_answers && 
        Array.isArray(result.questions) && Array.isArray(result.ideal_answers)) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw new Error('Invalid JSON structure in resume analysis')
  } catch (parseError) {
    console.error('JSON parse error in resume analysis:', parseError)
    
    // Provide fallback response
    const fallbackResult = {
      analysis: {
        skills: ['Communication', 'Problem Solving', 'Teamwork'],
        suggested_role: 'Professional',
        strengths: ['Experience in various projects', 'Diverse skill set'],
        areas_to_improve: ['Technical depth', 'Quantifiable achievements'],
        suggestions: 'Focus on highlighting specific achievements with measurable impact.',
        job_openings: [
          {
            role: 'Software Developer',
            locations: ['Bangalore', 'Hyderabad', 'Delhi', 'Mumbai', 'Pune'],
            global: ['USA', 'Germany', 'Singapore', 'Canada', 'UK']
          },
          {
            role: 'Senior Developer',
            locations: ['Chennai', 'Pune', 'Noida', 'Gurugram', 'Remote'],
            global: ['Netherlands', 'Australia', 'Dubai', 'Switzerland']
          }
        ]
      },
      questions: [
        'Tell me about your professional background and key achievements.',
        'What are your strongest technical skills?',
        'Describe a challenging project you worked on.',
        'How do you handle working under pressure?',
        'Where do you see yourself in 5 years?'
      ],
      ideal_answers: [
        'A comprehensive answer highlighting relevant experience, key achievements, and alignment with the role.',
        'A detailed response identifying specific strengths with concrete examples of how they have been applied successfully.',
        'A structured answer using the STAR method describing situation, task, action, and results.',
        'A thoughtful response demonstrating stress management skills and providing specific strategies used.',
        'An ambitious yet realistic answer showing career growth mindset and commitment to the field.'
      ]
    }
    
    return new Response(JSON.stringify(fallbackResult), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}