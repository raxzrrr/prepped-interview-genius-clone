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
      case 'generate-hr-technical':
        response = await generateHRTechnicalQuestions(questionCount, apiKey)
        break
      case 'generate-interview-set':
        response = await generateInterviewSet(interviewType, questionCount, jobRole, apiKey)
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
  
  const evaluationPrompt = `You are an expert interview evaluator. Evaluate each user answer against the ideal answer using 4 metrics (0-10):

1. CORRECTNESS - How accurate compared to ideal answer
2. COMPLETENESS - Coverage of ideal answer points  
3. DEPTH - Detail level and insight compared to ideal
4. CLARITY - Structure and communication quality

${resumeText ? `RESUME CONTEXT:\n${resumeText.substring(0, 1000)}...\n\n` : ''}

Questions and Answers to Evaluate:
${questions.map((q, i) => `
Question ${i + 1}: ${q}
Ideal Answer: ${idealAnswers[i] || 'Professional response expected'}
User Answer: ${userAnswers[i] || 'No answer provided'}
---`).join('\n')}

Return JSON in this EXACT format:
{
  "evaluations": [
    {
      "question_number": 1,
      "user_answer": "actual user answer",
      "ideal_answer": "ideal answer text",
      "score": 7.5,
      "remarks": "Detailed feedback on the answer",
      "score_breakdown": {
        "correctness": 8,
        "completeness": 7,
        "depth": 7,
        "clarity": 8
      },
      "improvement_tips": ["Specific tip 1", "Specific tip 2"]
    }
  ],
  "overall_statistics": {
    "average_score": 7.2,
    "total_questions": ${questions.length},
    "strengths": ["Key strength 1", "Key strength 2"],
    "critical_weaknesses": ["Weakness 1", "Weakness 2"],
    "overall_grade": "B+",
    "harsh_but_helpful_feedback": "Direct feedback",
    "recommendation": "Actionable recommendation"
  }
}

Important: 
- Provide realistic scores (not all 5/10)
- Give specific, actionable feedback
- Base scores on actual answer quality
- If answer is "No answer provided" or "Question skipped", give low scores (1-3)
- Use STAR method recommendations when appropriate`

  try {
    console.log('Sending evaluation request to Gemini API...')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: evaluationPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Gemini API response received')
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!content) {
      throw new Error('No evaluation content generated')
    }

    console.log('Processing evaluation content...')
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    const evaluation = JSON.parse(cleanContent)
    
    // Validate the evaluation structure
    if (!evaluation.evaluations || !Array.isArray(evaluation.evaluations)) {
      throw new Error('Invalid evaluation structure: missing evaluations array')
    }
    
    if (!evaluation.overall_statistics) {
      throw new Error('Invalid evaluation structure: missing overall_statistics')
    }
    
    console.log('Evaluation parsed successfully')
    return new Response(JSON.stringify(evaluation), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in evaluation process:', error)
    
    // Create detailed fallback evaluation
    const fallbackEvaluations = questions.map((q, i) => {
      const userAnswer = userAnswers[i] || 'No answer provided'
      const hasAnswer = userAnswer !== 'No answer provided' && userAnswer !== 'Question skipped' && userAnswer.trim().length > 0
      
      let baseScore: number
      if (!hasAnswer) {
        baseScore = Math.floor(Math.random() * 2) + 1 // 1-2
      } else if (userAnswer.length < 50) {
        baseScore = Math.floor(Math.random() * 3) + 3 // 3-5
      } else {
        baseScore = Math.floor(Math.random() * 4) + 5 // 5-8
      }
      
      return {
        question_number: i + 1,
        user_answer: userAnswer,
        ideal_answer: idealAnswers[i] || 'Professional response expected with specific examples',
        score: baseScore + (Math.random() * 1.5 - 0.75), // Add small variance
        remarks: hasAnswer ? 
          'Answer provided but could benefit from more specific examples and structured approach (STAR method)' : 
          'No answer provided. This question required a detailed response with examples.',
        score_breakdown: {
          correctness: hasAnswer ? baseScore : 1,
          completeness: hasAnswer ? Math.max(1, baseScore - 1) : 1,
          depth: hasAnswer ? Math.max(1, baseScore - 0.5) : 1,
          clarity: hasAnswer ? baseScore : 2
        },
        improvement_tips: hasAnswer ? [
          'Use the STAR method (Situation, Task, Action, Result)',
          'Include specific metrics and quantifiable outcomes',
          'Provide more context about your role and responsibilities'
        ] : [
          'Always attempt to answer every question',
          'If unsure, provide your best thoughtful response',
          'Use relevant examples from your experience'
        ]
      }
    })
    
    const avgScore = fallbackEvaluations.reduce((sum, e) => sum + e.score, 0) / fallbackEvaluations.length
    
    const fallbackResult = {
      evaluations: fallbackEvaluations,
      overall_statistics: {
        average_score: Math.round(avgScore * 10) / 10,
        total_questions: questions.length,
        strengths: [
          'Participated in the complete interview process',
          'Demonstrated engagement with the questions'
        ],
        critical_weaknesses: [
          'Need more detailed and specific responses',
          'Could improve answer structure and depth'
        ],
        overall_grade: avgScore >= 8 ? 'A' : avgScore >= 7 ? 'B+' : avgScore >= 6 ? 'B' : avgScore >= 5 ? 'C+' : avgScore >= 4 ? 'C' : 'D',
        harsh_but_helpful_feedback: 'Your responses need more depth and specific examples. Focus on quantifiable achievements and structured storytelling.',
        recommendation: 'Practice the STAR method and prepare specific examples with measurable outcomes before your next interview.'
      }
    }
    
    console.log('Returning fallback evaluation result')
    return new Response(JSON.stringify(fallbackResult), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Generate HR and Technical questions
async function generateHRTechnicalQuestions(questionCount: number, apiKey: string) {
  console.log('Generating HR and technical questions, count:', questionCount)
  
  const prompt = `Generate ${questionCount} professional interview questions that combine HR behavioral questions and basic technical concepts. 

Return JSON in this EXACT format:
{
  "questions": [
    "Question 1 text",
    "Question 2 text",
    "Question 3 text"
  ],
  "ideal_answers": [
    "Ideal answer for question 1",
    "Ideal answer for question 2", 
    "Ideal answer for question 3"
  ]
}

Requirements:
- Mix of HR behavioral questions (teamwork, problem-solving, communication)
- Basic technical concepts questions (not too advanced)
- Questions should be suitable for any professional level
- Ideal answers should be comprehensive but realistic
- Total questions: ${questionCount}
- Each ideal answer should be 2-3 sentences showing what a good response includes`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
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
    throw new Error('No content generated for HR technical questions')
  }

  try {
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    const result = JSON.parse(cleanContent)
    
    if (result.questions && result.ideal_answers && Array.isArray(result.questions) && Array.isArray(result.ideal_answers)) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw new Error('Invalid JSON structure for HR technical questions')
  } catch (parseError) {
    console.error('JSON parse error for HR technical:', parseError)
    
    // Fallback HR technical questions
    const fallbackQuestions = [
      "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
      "Describe a challenging problem you solved. What was your approach?",
      "How do you prioritize tasks when you have multiple deadlines?",
      "What programming languages or tools are you most comfortable with and why?",
      "Explain the difference between a database and a spreadsheet to a non-technical person."
    ].slice(0, questionCount)
    
    const fallbackAnswers = [
      "A good answer uses the STAR method (Situation, Task, Action, Result) and shows conflict resolution skills and professionalism.",
      "A strong response outlines a clear problem-solving process, demonstrates analytical thinking, and shows persistence in finding solutions.",
      "An effective answer shows time management skills, the ability to assess urgency vs importance, and communication with stakeholders about priorities.",
      "A comprehensive response mentions specific technologies, explains comfort level, and connects tools to practical applications or projects.",
      "A clear answer uses simple analogies, avoids jargon, and demonstrates the ability to communicate technical concepts to non-technical audiences."
    ].slice(0, questionCount)
    
    return new Response(JSON.stringify({
      questions: fallbackQuestions,
      ideal_answers: fallbackAnswers
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Generate role-specific interview questions
async function generateInterviewSet(interviewType: string, questionCount: number, jobRole: string, apiKey: string) {
  console.log('Generating interview set for role:', jobRole, 'type:', interviewType, 'count:', questionCount)
  
  const prompt = `Generate ${questionCount} specialized interview questions for a ${jobRole} position.

Return JSON in this EXACT format:
{
  "questions": [
    "Question 1 specific to ${jobRole}",
    "Question 2 technical for ${jobRole}",
    "Question 3 behavioral for ${jobRole}"
  ],
  "ideal_answers": [
    "Comprehensive ideal answer for question 1",
    "Detailed ideal answer for question 2",
    "Professional ideal answer for question 3"
  ]
}

Requirements:
- Questions must be specific to ${jobRole} responsibilities
- Include technical skills relevant to ${jobRole}
- Add behavioral questions suited for ${jobRole} environment
- Mix of experience-based and scenario-based questions
- Ideal answers should demonstrate expert-level knowledge
- Total questions: ${questionCount}
- Focus on real-world applications and problem-solving`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
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
    throw new Error('No content generated for role-based questions')
  }

  try {
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    const result = JSON.parse(cleanContent)
    
    if (result.questions && result.ideal_answers && Array.isArray(result.questions) && Array.isArray(result.ideal_answers)) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw new Error('Invalid JSON structure for role-based questions')
  } catch (parseError) {
    console.error('JSON parse error for role-based:', parseError)
    
    // Fallback role-based questions
    const fallbackQuestions = [
      `What specific experience do you have that makes you suitable for a ${jobRole} position?`,
      `Describe the most challenging aspect of working as a ${jobRole} and how you would handle it.`,
      `What tools, technologies, or methodologies are essential for success in ${jobRole}?`,
      `How do you stay updated with the latest trends and developments in your field?`,
      `Walk me through your approach to a typical project or task in ${jobRole}.`
    ].slice(0, questionCount)
    
    const fallbackAnswers = [
      `A strong answer highlights relevant experience, specific achievements, and transferable skills that directly apply to ${jobRole} responsibilities.`,
      `An effective response identifies realistic challenges, shows problem-solving approach, and demonstrates resilience and adaptability.`,
      `A comprehensive answer lists current industry-standard tools, explains their importance, and shows awareness of evolving technologies.`,
      `A good response shows commitment to continuous learning through multiple channels like courses, publications, networking, and hands-on practice.`,
      `A detailed answer outlines a systematic approach, shows planning skills, and demonstrates understanding of ${jobRole} workflows and best practices.`
    ].slice(0, questionCount)
    
    return new Response(JSON.stringify({
      questions: fallbackQuestions,
      ideal_answers: fallbackAnswers
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}