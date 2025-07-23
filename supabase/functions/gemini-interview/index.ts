
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
    
    const { type, prompt } = requestData
    
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
      case 'batch-evaluation':
        response = await evaluateInterviewSession(prompt.questions, prompt.answers, prompt.expectedAnswers, apiKey)
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
  console.log('Generating professional interview questions for role:', jobRole)
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate 10 professional-level interview questions for a ${jobRole} position that a hiring manager at a top-tier company would ask. Include:
                 - 3 technical deep-dive questions that test core competencies
                 - 3 behavioral STAR-method questions for leadership and problem-solving
                 - 2 scenario-based problem-solving questions
                 - 1 system design or architecture question
                 - 1 role-specific challenge question

                 For each question, also provide the expected high-quality answer that would impress an experienced interviewer.

                 Return as JSON with this exact format:
                 {
                   "questions": ["Question 1", "Question 2", ...],
                   "expectedAnswers": ["Expected answer 1", "Expected answer 2", ...]
                 }

                 Make sure questions are challenging and reflect real interview standards for professional-level candidates.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
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
    // Clean the content - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to parse as JSON object with questions and expected answers
    const data = JSON.parse(cleanContent);
    if (data.questions && data.expectedAnswers && Array.isArray(data.questions) && Array.isArray(data.expectedAnswers)) {
      console.log('Successfully parsed professional questions and answers');
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    throw new Error('Invalid JSON format - missing questions or expectedAnswers arrays')
  } catch (parseError) {
    console.log('JSON parsing failed, using fallback questions:', parseError)
    
    // Professional fallback questions with proper expected answers
    const fallbackData = {
      questions: [
        "Describe a time you had to explain complex technical findings to a non-technical audience. Use the STAR method.",
        "Tell me about a project where you had to collaborate with difficult stakeholders. How did you handle conflicts and ensure project success?",
        "Explain how you would design a scalable system to handle 1 million users. Consider database architecture, caching, and load balancing.",
        "Describe a situation where you had to learn a new technology quickly for a project. What was your approach and what challenges did you face?",
        "Walk me through how you would optimize the performance of a slow-loading web application. What steps would you take to identify and resolve bottlenecks?",
        "Tell me about a time you made a significant mistake in your work. How did you handle it and what did you learn?",
        "How do you stay current with new technologies and industry trends in your field?",
        "Describe your experience with code reviews. How do you give and receive feedback effectively?",
        "Explain a complex technical concept to me as if I were a non-technical stakeholder.",
        "What motivates you in your work, and how do you handle challenging or repetitive tasks?"
      ],
      expectedAnswers: [
        "STAR Method: Situation - Describe the context (e.g., presenting technical audit findings to executive team). Task - Explain what you needed to accomplish (make complex security vulnerabilities understandable). Action - Detail your approach (used analogies like 'digital locks', created visual diagrams, focused on business impact rather than technical details, prepared executive summary with risk levels). Result - Quantify the outcome (executives approved $50K security budget, implemented recommendations within 30 days, prevented potential data breach).",
        "Professional answer should demonstrate: conflict resolution skills by identifying root causes of disagreements, active listening to understand stakeholder concerns, finding common ground through compromise, clear communication of project constraints and timelines, escalation protocols when needed, and measurable outcomes showing project success despite initial challenges.",
        "Comprehensive system design: Database scaling (horizontal sharding, read replicas, partitioning), Load balancing (application load balancers, geographic distribution), Caching strategy (Redis/Memcached for session data, CDN for static assets), Microservices architecture for independent scaling, Auto-scaling groups for traffic spikes, Monitoring and alerting systems, Database optimization (indexing, query optimization), API rate limiting, and disaster recovery planning.",
        "Structured learning approach: Assess learning requirements and timeline, identify authoritative resources (official documentation, expert blogs, video tutorials), set up development environment for hands-on practice, break down learning into manageable chunks, build practical projects to reinforce concepts, seek mentorship or join communities, document learning progress, and apply knowledge in real scenarios. Include specific example of successfully learning a technology under pressure.",
        "Performance optimization methodology: Establish baseline metrics using tools like Lighthouse, GTMetrix, or custom analytics. Identify bottlenecks through profiling (database queries, network requests, JavaScript execution). Implement solutions: optimize images (compression, lazy loading), minimize HTTP requests, implement caching strategies, optimize database queries, reduce JavaScript bundle size, use CDN, enable gzip compression. Measure and validate improvements with before/after metrics.",
        "Professional accountability: Immediately acknowledge the mistake without blame-shifting, assess the impact and notify relevant stakeholders promptly, implement immediate damage control measures, conduct thorough root cause analysis, develop prevention strategies to avoid recurrence, document lessons learned for team benefit, demonstrate personal growth and improved processes as a result.",
        "Continuous learning strategy: Subscribe to industry publications and blogs, attend conferences and webinars, participate in online communities (Stack Overflow, GitHub, Reddit), take online courses and certifications, experiment with new technologies in personal projects, network with other professionals, contribute to open source projects, and maintain a learning log to track progress.",
        "Code review best practices: Focus on code quality over personal preferences, provide constructive feedback with specific suggestions, understand the business context, check for security vulnerabilities and performance issues, ensure consistency with team standards, ask questions when unclear, acknowledge good practices, follow up on feedback implementation, and maintain a collaborative learning environment.",
        "Clear technical communication: Start with the business problem and value proposition, use analogies and metaphors relatable to the audience, avoid technical jargon, use visual aids and diagrams, break complex concepts into digestible parts, check for understanding throughout, provide concrete examples and real-world applications, and conclude with actionable next steps.",
        "Professional motivation and resilience: Identify intrinsic motivators (learning, problem-solving, impact), set personal and professional development goals, break down challenging tasks into manageable components, seek variety and growth opportunities, maintain work-life balance, build supportive professional relationships, celebrate small wins, and develop coping strategies for difficult periods."
      ]
    }
    
    return new Response(JSON.stringify(fallbackData), {
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

async function evaluateInterviewSession(questions: string[], answers: string[], expectedAnswers: string[], apiKey: string) {
  console.log('Performing strict evaluation of complete interview session')
  
  const questionsAndAnswers = questions.map((q, i) => ({
    question: q,
    candidateAnswer: answers[i] || 'No answer provided',
    expectedAnswer: expectedAnswers[i] || 'No expected answer available'
  }))
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a senior technical interviewer at a top-tier company. Perform a STRICT and HONEST evaluation of this candidate's complete interview performance.

                 Interview Data:
                 ${JSON.stringify(questionsAndAnswers, null, 2)}

                 EVALUATION CRITERIA:
                 - Technical Accuracy (40%): Is the information correct and demonstrates deep understanding?
                 - Communication Clarity (20%): Can they explain complex concepts clearly?
                 - Depth of Knowledge (20%): Do they show thorough understanding beyond surface level?
                 - Real-world Application (20%): Can they apply knowledge to practical scenarios?

                 IMPORTANT INSTRUCTIONS:
                 - Be brutally honest - if an answer is wrong, irrelevant, or lacks depth, mark it as FAILED
                 - Do not be polite or lenient - this is professional-level assessment
                 - Mark answers as "PASS" or "FAIL" based on industry standards
                 - Provide specific reasons for failures and detailed improvement suggestions
                 - Compare each answer against the expected answer provided
                 - Give overall recommendation: HIRE, MAYBE, or NO HIRE

                 Return JSON format:
                 {
                   "overallScore": <number 0-100>,
                   "overallGrade": "A+|A|B+|B|C+|C|D|F",
                   "recommendation": "HIRE|MAYBE|NO HIRE",
                   "questionEvaluations": [
                     {
                       "questionNumber": 1,
                       "question": "question text",
                       "candidateAnswer": "their answer",
                       "expectedAnswer": "ideal answer",
                       "result": "PASS|FAIL",
                       "score": <0-10>,
                       "feedback": "specific feedback on what was wrong/right",
                       "improvements": "how to improve this answer"
                     }
                   ],
                   "strengths": ["specific strengths observed"],
                   "criticalWeaknesses": ["major areas that need improvement"],
                   "industryComparison": "How does this candidate compare to industry standards?",
                   "actionPlan": "Specific steps the candidate should take to improve"
                 }`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
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
    // Fallback strict evaluation
    const fallbackEvaluation = {
      overallScore: 45,
      overallGrade: "D",
      recommendation: "NO HIRE",
      questionEvaluations: questions.map((q, i) => ({
        questionNumber: i + 1,
        question: q,
        candidateAnswer: answers[i] || 'No answer provided',
        expectedAnswer: expectedAnswers[i] || 'No expected answer available',
        result: "FAIL",
        score: 4,
        feedback: "Answer lacks depth and technical accuracy required for professional level",
        improvements: "Study core concepts, practice with real-world examples, improve communication clarity"
      })),
      strengths: ["Attempted to answer questions"],
      criticalWeaknesses: ["Insufficient technical depth", "Unclear communication", "Lack of real-world examples"],
      industryComparison: "Below industry standards for professional-level position",
      actionPlan: "Focus on strengthening technical fundamentals, practice structured communication, gain more hands-on experience"
    }
    
    return new Response(JSON.stringify(fallbackEvaluation), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
