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

// Bulk evaluate all answers at once
async function bulkEvaluateAnswers(
  questions: string[], 
  userAnswers: string[], 
  idealAnswers: string[], 
  apiKey: string
) {
  console.log('Bulk evaluating answers')
  
  const evaluationPrompt = `You are an EXTREMELY STRICT professional interview evaluator. Your job is to provide harsh, honest feedback that will genuinely help candidates improve. Most candidates should score 4-6 out of 10.

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Ideal Answer: ${idealAnswers[i] || 'Standard professional response expected'}
User Answer: ${userAnswers[i] || 'No answer provided'}
`).join('\n')}

STRICT Evaluation Criteria (Be HARSH but FAIR):
- Correctness (40%): Is the answer factually correct? Wrong information = 0-3 points
- Completeness (25%): Does it fully address the question? Partial answers = 3-5 points  
- Depth (20%): Shows real understanding or just surface level? Shallow = 2-4 points
- Clarity (15%): Well-structured communication? Rambling/unclear = 2-5 points

STRICT Scoring Scale (Most people get 4-6):
- 0-2: Completely Wrong - Factually incorrect, irrelevant, or no understanding shown
- 3-4: Poor - Major gaps, mostly wrong, shows little understanding
- 5-6: Below Average - Some correct points but significant issues, incomplete
- 7-8: Good - Mostly correct, minor gaps, decent understanding shown
- 9-10: Excellent - Comprehensive, accurate, well-structured, exceptional answer

IMPORTANT SCORING GUIDELINES:
- Score 9-10 ONLY for truly exceptional answers that would impress senior managers
- Score 7-8 for solid answers that meet job requirements
- Score 5-6 for answers that show basic understanding but have clear gaps
- Score 3-4 for answers with major problems or significant inaccuracies
- Score 0-2 for completely wrong or irrelevant answers

Be STRICT. If an answer is vague, incomplete, or shows lack of depth, score it accordingly. The goal is honest feedback for improvement.

Return response in this exact JSON format:
{
  "evaluations": [
    {
      "question_number": 1,
      "user_answer": "The actual user answer",
      "ideal_answer": "The expected ideal answer showing what a 9-10 response looks like",
      "score": 5,
      "remarks": "Direct, honest feedback: what was wrong, what was missing, specific areas for improvement",
      "score_breakdown": {
        "correctness": 6,
        "completeness": 4,
        "depth": 5,
        "clarity": 6
      },
      "improvement_tips": [
        "Specific actionable tip 1",
        "Specific actionable tip 2"
      ]
    }
  ],
  "overall_statistics": {
    "average_score": 5.2,
    "total_questions": ${questions.length},
    "strengths": ["Specific strengths observed"],
    "critical_weaknesses": ["Major areas that need work"],
    "overall_grade": "C",
    "harsh_but_helpful_feedback": "Honest summary of performance with specific improvement areas",
    "recommendation": "Specific practice areas and next steps for improvement"
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
  console.log('Analyzing resume with comprehensive analysis and interview questions')
  
  const prompt = `You are an expert career coach and technical interviewer. Analyze the provided resume (in PDF base64 format) and provide comprehensive analysis with interview questions.

You must:

1. **Resume Analysis** - Provide structured analysis in this exact JSON format:
{
  "analysis": {
    "skills": ["skill1", "skill2", "skill3"],
    "suggested_role": "Suggested job role based on experience",
    "strengths": ["strength1", "strength2", "strength3"],
    "areas_to_improve": ["area1", "area2", "area3"],
    "suggestions": "Specific suggestions for improvement",
    "job_openings": [
      {
        "role": "Matching role 1",
        "locations": ["City1", "City2", "Remote"]
      },
      {
        "role": "Matching role 2", 
        "locations": ["City3", "City4", "Remote"]
      },
      {
        "role": "Matching role 3",
        "locations": ["Remote", "City5", "City6"]
      }
    ]
  },
  "interview_questions": [
    "Question 1 specific to resume experience",
    "Question 2 about specific projects mentioned",
    "Question 3 about technical skills listed",
    "Question 4 behavioral based on career progression",
    "Question 5 about achievements and metrics",
    "Question 6 technical depth question",
    "Question 7 scenario-based on their background",
    "Question 8 about specific technologies/tools",
    "Question 9 leadership/teamwork based on experience",
    "Question 10 future goals aligned with background"
  ]
}

2. **Requirements for job_openings**: Suggest 3-5 relevant opportunities in different parts of the country (not tied to only one city), aligned with the candidate's suggested role.

3. **Interview Questions Requirements**: Generate **at least 10 interview questions** that are:
   - Highly specific to the candidate's resume (projects, skills, experience)
   - Aligned with the "suggested_role"
   - Mix of technical and behavioral questions
   - Avoid generic filler questions
   - Target evaluation for readiness for the suggested role
   - Cover technical depth, problem-solving, role-specific scenarios
   - Balanced difficulty (easy → medium → hard)

Resume Data: ${resumeBase64}

Return ONLY the JSON response in the exact format specified above.`

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
        maxOutputTokens: 4000,
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

  console.log('Generated resume analysis content:', content)

  try {
    // Clean the response by removing markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(cleanContent)
    
    // Validate the structure matches requirements
    if (result.analysis && result.interview_questions && 
        Array.isArray(result.interview_questions) &&
        result.interview_questions.length >= 10 &&
        result.analysis.job_openings &&
        Array.isArray(result.analysis.job_openings)) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    throw new Error('Invalid JSON structure - missing required fields')
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    // Comprehensive fallback response matching the exact requirements
    const fallbackResponse = {
      analysis: {
        skills: ["Communication", "Problem Solving", "Technical Skills", "Project Management"],
        suggested_role: "Software Developer",
        strengths: ["Relevant technical experience", "Good project history", "Professional background"],
        areas_to_improve: ["Add more quantifiable metrics", "Highlight leadership experience", "Include certification details"],
        suggestions: "Consider adding specific achievements with metrics, highlight any leadership roles, and include relevant certifications or training.",
        job_openings: [
          {
            role: "Software Developer",
            locations: ["San Francisco", "New York", "Remote"]
          },
          {
            role: "Full Stack Developer", 
            locations: ["Austin", "Seattle", "Remote"]
          },
          {
            role: "Frontend Developer",
            locations: ["Remote", "Chicago", "Denver"]
          },
          {
            role: "Backend Developer",
            locations: ["Boston", "Atlanta", "Remote"]
          }
        ]
      },
      interview_questions: [
        "Tell me about a specific project mentioned in your resume and the technical challenges you faced.",
        "How did you approach problem-solving in your previous role?",
        "Describe your experience with the technologies listed on your resume.",
        "Walk me through your decision-making process for a recent technical implementation.",
        "How do you stay updated with new technologies and industry trends?",
        "Describe a time when you had to work with a difficult team member or stakeholder.",
        "What methodologies have you used for project management in your experience?",
        "How do you handle code reviews and ensure code quality in your team?",
        "Tell me about a time when you had to learn a new technology quickly for a project.",
        "Where do you see yourself in the next 3-5 years based on your current trajectory?",
        "How do you approach debugging and troubleshooting complex technical issues?",
        "Describe your experience with version control and collaborative development practices."
      ]
    }
    
    return new Response(JSON.stringify(fallbackResponse), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
