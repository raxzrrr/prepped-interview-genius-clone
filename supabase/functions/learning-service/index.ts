
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LearningServiceRequest {
  action: 'create' | 'update' | 'fetch' | 'updateAssessment' | 'evaluateAssessment';
  clerkUserId: string;
  data?: any;
  totalModules?: number;
  questions?: any[];
  answers?: any[];
}

// Fixed namespace UUID for consistent generation
const NAMESPACE_UUID = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// Generate consistent UUID from Clerk User ID for database operations (matches client-side utility)
const generateConsistentUUID = (userId: string): string => {
  try {
    // Simple hash function to create deterministic UUID (matches client logic)
    let hash = 0;
    const input = userId + NAMESPACE_UUID;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to hex and pad to create UUID format
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(0, 3)}-${hex.slice(0, 12).padEnd(12, '0')}`;
  } catch (error) {
    console.error("Error generating consistent UUID:", error);
    // Fallback to a simple UUID-like format
    const randomHex = Math.random().toString(16).substring(2, 10);
    return `${randomHex}-0000-4000-a000-000000000000`;
  }
};

// Certificate generation function
const generateCertificate = async (supabase: any, params: {
  userId: string;
  name: string;
  courseId: string;
  courseName: string;
  score: number;
}): Promise<{ success: boolean; certificateId?: string; message?: string }> => {
  const PASSING_SCORE = 70;
  
  if (params.score < PASSING_SCORE) {
    console.log('Score below passing threshold, no certificate generated');
    return { success: false, message: 'Score below passing threshold' };
  }

  try {
    // Get default certificate from certificates table
    const { data: defaultCertificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_active', true)
      .eq('certificate_type', 'completion')
      .single();

    if (certError || !defaultCertificate) {
      console.warn('No default certificate found');
      return { success: false, message: 'No certificate template available' };
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('user_certificates')
      .select('id')
      .eq('user_id', params.userId)
      .eq('certificate_id', defaultCertificate.id)
      .maybeSingle();

    if (existingCert) {
      console.log('Certificate already exists for user:', params.userId);
      return { success: true, certificateId: existingCert.id, message: 'Certificate already exists' };
    }

    // Generate verification code
    const verificationCode = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Save to user_certificates table
    const { data: newCert, error: saveError } = await supabase
      .from('user_certificates')
      .insert({
        user_id: params.userId,
        certificate_id: defaultCertificate.id,
        verification_code: verificationCode,
        score: params.score,
        completion_data: {
          course_id: params.courseId,
          course_name: params.courseName,
          completion_date: new Date().toISOString(),
          score: params.score,
          passing_score: PASSING_SCORE,
          user_name: params.name
        },
        is_active: true
      })
      .select('id')
      .single();

    if (saveError) {
      throw saveError;
    }

    console.log('Certificate generated successfully for user:', params.userId);
    return { success: true, certificateId: newCert.id, message: 'Certificate generated successfully' };
  } catch (error) {
    console.error('Error generating certificate:', error);
    return { success: false, message: error.message || 'Certificate generation failed' };
  }
};

Deno.serve(async (req) => {
  console.log('Learning service function invoked:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, clerkUserId, data, totalModules, questions, answers }: LearningServiceRequest = await req.json();
    console.log('Request received:', { action, clerkUserId, hasData: !!data, totalModules });
    
    if (!clerkUserId) {
      throw new Error('Clerk user ID is required');
    }

    // Generate consistent UUID from Clerk user ID
    const supabaseUserId = generateConsistentUUID(clerkUserId);
    console.log('Processing request for Clerk user:', clerkUserId, 'as UUID:', supabaseUserId);

    let result;

    switch (action) {
      case 'fetch':
        console.log('Fetching user learning data...');
        
        // Try to find existing record
        const { data: existingData, error: fetchError } = await supabase
          .from('user_learning')
          .select('*')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
        
        if (!existingData && totalModules) {
          console.log('Creating new learning record...');
          // Create new record if none exists
          const newRecord = {
            user_id: supabaseUserId,
            course_id: data.courseId,
            progress: {},
            completed_modules_count: 0,
            total_modules_count: totalModules,
            assessment_attempted: false,
            assessment_score: null,
            last_assessment_score: 0,
            is_completed: false,
            assessment_passed: false,
            assessment_completed_at: null
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error:', createError);
            result = null; // Return null for graceful fallback
          } else {
            result = createdData;
            console.log('Created new learning record:', result.id);
          }
        } else {
          result = existingData;
          console.log('Found existing learning record:', result?.id || 'none');
        }
        break;

      case 'update':
        console.log('Updating learning record...');
        
        // First ensure record exists
        const { data: checkData } = await supabase
          .from('user_learning')
          .select('id')
          .eq('user_id', supabaseUserId)
          .maybeSingle();
        
        if (!checkData) {
          console.log('No existing record found, creating one first...');
          const newRecord = {
            user_id: supabaseUserId,
            course_id: data.courseId,
            progress: data.course_progress || {},
            completed_modules_count: data.completed_modules || 0,
            total_modules_count: data.total_modules || 0,
            assessment_attempted: false,
            assessment_score: null,
            last_assessment_score: 0,
            is_completed: false,
            assessment_passed: false,
            assessment_completed_at: null
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error during update:', createError);
            throw createError;
          }
          result = createdData;
          console.log('Created new learning record during update:', result.id);
        } else {
          const { data: updateData, error: updateError } = await supabase
            .from('user_learning')
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', supabaseUserId)
            .select('*')
            .single();
          
          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
          result = updateData;
          console.log('Updated learning record:', result.id);
        }
        break;

      case 'updateAssessment':
        console.log('Updating assessment score...');
        
        // Ensure record exists first
        const { data: assessmentCheckData } = await supabase
          .from('user_learning')
          .select('id')
          .eq('user_id', supabaseUserId)
          .eq('course_id', data.course_id)
          .maybeSingle();
        
        if (!assessmentCheckData) {
          // Create record if it doesn't exist
          const newRecord = {
            user_id: supabaseUserId,
            course_id: data.course_id,
            progress: {},
            completed_modules_count: 0,
            total_modules_count: 0,
            assessment_attempted: data.assessment_attempted,
            assessment_passed: data.assessment_passed,
            assessment_score: data.assessment_score,
            last_assessment_score: data.last_assessment_score,
            assessment_completed_at: data.assessment_completed_at,
            is_completed: false
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_learning')
            .insert(newRecord)
            .select('*')
            .single();

          if (createError) {
            console.error('Create error during assessment update:', createError);
            throw createError;
          }
          result = createdData;
          console.log('Created new learning record for assessment:', result.id);
        } else {
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('user_learning')
            .update({
              assessment_attempted: data.assessment_attempted,
              assessment_passed: data.assessment_passed,
              assessment_score: data.assessment_score,
              last_assessment_score: data.last_assessment_score,
              assessment_completed_at: data.assessment_completed_at,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', supabaseUserId)
            .eq('course_id', data.course_id)
            .select('*')
            .single();
          
          if (assessmentError) {
            console.error('Assessment update error:', assessmentError);
            throw assessmentError;
          }
          result = assessmentData;
          console.log('Updated assessment score:', data.assessment_score);
        }

        // Generate certificate if user passed
        if (data.assessment_passed) {
          console.log('User passed assessment, generating certificate...');
          
        // Get user profile for certificate, create if not exists
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', supabaseUserId)
          .maybeSingle();

        if (profileError || !profileData) {
          console.log('Profile not found, attempting to find by email or create one...');
          
          // Try to find profile by email (for Clerk users)
          const { data: clerkUser } = await supabase.auth.admin.getUserById(clerkUserId);
          if (clerkUser?.user?.email) {
            let { data: emailProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', clerkUser.user.email)
              .maybeSingle();
              
            if (emailProfile) {
              profileData = emailProfile;
            } else {
              // Create new profile
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: supabaseUserId,
                  email: clerkUser.user.email,
                  full_name: clerkUser.user.user_metadata?.full_name || 'Student',
                  role: 'student'
                })
                .select('full_name, email')
                .single();
                
              if (!createError && newProfile) {
                profileData = newProfile;
              }
            }
          }
        }

        if (profileData) {
            // Get course name for certificate
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('name')
              .eq('id', data.course_id)
              .maybeSingle();

            const courseName = courseData?.name || 'Course';

            try {
              await generateCertificate(supabase, {
                userId: supabaseUserId,
                name: profileData.full_name,
                courseId: data.course_id,
                courseName: courseName,
                score: data.assessment_score
              });
            } catch (certError) {
              console.error('Certificate generation failed:', certError);
              // Don't throw - assessment should still be saved even if certificate fails
            }
          }
        }
        break;

      case 'evaluateAssessment':
        console.log('Evaluating assessment...');
        
        if (!questions || !answers || !data?.courseId) {
          throw new Error('Questions, answers, and courseId are required for assessment evaluation');
        }

        // Fetch course questions from database
        const { data: courseQuestions, error: questionsError } = await supabase
          .from('course_questions')
          .select('*')
          .eq('course_id', data.courseId)
          .eq('is_active', true)
          .order('order_index');

        if (questionsError) {
          throw new Error(`Failed to fetch course questions: ${questionsError.message}`);
        }

        if (!courseQuestions || courseQuestions.length === 0) {
          throw new Error('No questions found for this course');
        }

        // Calculate score
        let correctAnswers = 0;
        const evaluatedAnswers = answers.map((answer: any) => {
          const question = courseQuestions.find(q => q.id === answer.questionId);
          const isCorrect = question && answer.selectedAnswer === question.correct_answer;
          
          if (isCorrect) {
            correctAnswers++;
          }

          return {
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: isCorrect,
            correctAnswer: question?.correct_answer || null
          };
        });

        const totalQuestions = courseQuestions.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= 70;

        const assessmentResult = {
          totalQuestions,
          correctAnswers,
          score,
          passed,
          answers: evaluatedAnswers
        };

        // Save assessment results to user_learning table
        const assessmentData = {
          assessment_attempted: true,
          assessment_passed: passed,
          assessment_score: score,
          last_assessment_score: score,
          assessment_completed_at: new Date().toISOString(),
          is_completed: passed, // Mark course as completed if assessment is passed
          total_modules_count: totalModules || 0 // Use provided totalModules
        };

        // Check if user_learning record exists
        const { data: existingLearning } = await supabase
          .from('user_learning')
          .select('id')
          .eq('user_id', supabaseUserId)
          .eq('course_id', data.courseId)
          .maybeSingle();

        if (existingLearning) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_learning')
            .update({
              ...assessmentData,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', supabaseUserId)
            .eq('course_id', data.courseId);

          if (updateError) {
            throw new Error(`Failed to update assessment results: ${updateError.message}`);
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('user_learning')
            .insert({
              user_id: supabaseUserId,
              course_id: data.courseId,
              progress: {},
              completed_modules_count: 0,
              ...assessmentData
            });

          if (insertError) {
            throw new Error(`Failed to save assessment results: ${insertError.message}`);
          }
        }

        // Generate certificate if passed
        let certificateResult = { success: false, message: 'Not applicable' };
        if (passed && data.courseName) {
          try {
            // Get user profile for certificate, create if not exists
            let { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', supabaseUserId)
              .maybeSingle();

            if (profileError || !profileData) {
              console.log('Profile not found for certificate, attempting to create one...');
              
              // Try to find profile by email or create one
              const { data: clerkUser } = await supabase.auth.admin.getUserById(clerkUserId);
              if (clerkUser?.user?.email) {
                let { data: emailProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('email', clerkUser.user.email)
                  .maybeSingle();
                  
                if (emailProfile) {
                  profileData = emailProfile;
                } else {
                  // Create new profile
                  const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: supabaseUserId,
                      email: clerkUser.user.email,
                      full_name: clerkUser.user.user_metadata?.full_name || 'Student',
                      role: 'student'
                    })
                    .select('full_name, email')
                    .single();
                    
                  if (!createError && newProfile) {
                    profileData = newProfile;
                  }
                }
              }
            }

            if (profileData?.full_name) {
              certificateResult = await generateCertificate(supabase, {
                userId: supabaseUserId,
                name: profileData.full_name,
                courseId: data.courseId,
                courseName: data.courseName,
                score: score
              });
            }
          } catch (certError) {
            console.error('Certificate generation failed:', certError);
            certificateResult = { success: false, message: 'Certificate generation failed' };
          }
        }

        result = {
          ...assessmentResult,
          saved: true,
          certificateGenerated: certificateResult.success
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('Request completed successfully');
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Learning service error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred in the learning service' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
