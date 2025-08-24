import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, FileText, Loader2, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import interviewService from '@/services/interviewService';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import ProFeatureGuard from '@/components/ProFeatureGuard';
import LiveCameraPreview from '@/components/LiveCameraPreview';

const CustomInterviewsPage: React.FC = () => {
  const { user, isStudent, getSupabaseUserId } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'completed'>('setup');
  const [activeTab, setActiveTab] = useState('role');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [jobRole, setJobRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Interview data
  const [questions, setQuestions] = useState<string[]>([]);
  const [idealAnswers, setIdealAnswers] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [interviewType, setInterviewType] = useState<'role_based' | 'resume_based'>('role_based');

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  const handleRoleBasedQuestions = async () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job Role Required",
        description: "Please enter a job role to generate questions.",
        variant: "destructive",
      });
      return;
    }

    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in properly.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      console.log("Generating role-based questions for:", jobRole, "User:", supabaseUserId);
      
      // Generate role-specific questions
      const questionSet = await interviewService.generateInterviewSet(
        'role_based',
        questionCount,
        jobRole
      );
      
      // Create interview session
      const session = await interviewService.createInterviewSession(
        'role_based',
        questionCount,
        questionSet.questions,
        questionSet.ideal_answers,
        jobRole
      );
      
      setQuestions(questionSet.questions);
      setIdealAnswers(questionSet.ideal_answers);
      setSessionId(session.id);
      setInterviewType('role_based');
      setCurrentStep('interview');
      
      toast({
        title: "Questions Generated",
        description: `Generated ${questionCount} role-specific questions for ${jobRole}`,
      });
    } catch (error: any) {
      console.error('Error generating role-based questions:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResumeAnalysisComplete = async (generatedQuestions: any, analysis: any) => {
    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in properly.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      console.log("Resume analysis complete for user:", supabaseUserId);
      
      // Extract analysis, questions, and ideal answers from the new API response
      const { analysis, questions, ideal_answers } = generatedQuestions;
      
      // Create interview session with the questions and ideal answers from API Call 1
      // Cap question count at 10 to respect database constraint (5-10 allowed)
      const questionCount = Math.min(Math.max(questions.length, 5), 10);
      const session = await interviewService.createInterviewSession(
        'resume_based',
        questionCount,
        questions.slice(0, 10), // Use only first 10 questions for session
        (ideal_answers || questions.map(() => 'Ideal answer based on resume analysis')).slice(0, 10),
        analysis?.suggested_role
      );
      
      // Use only first 10 questions to respect database constraint
      setQuestions(questions.slice(0, 10));
      setIdealAnswers((ideal_answers || questions.map(() => 'Ideal answer based on resume analysis')).slice(0, 10));
      setResumeAnalysis(analysis);
      setSessionId(session.id);
      setInterviewType('resume_based');
      setCurrentStep('interview');
      
      toast({
        title: "Resume Analysis Complete",
        description: `Generated comprehensive analysis with ${questions.length} personalized interview questions and job opportunities`,
      });
    } catch (error: any) {
      console.error('Error with resume-based interview:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInterviewComplete = async (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[],
    interviewId?: string 
  }) => {
    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in properly.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Interview completed for user:', supabaseUserId, 'Session:', sessionId);
      
      // Perform bulk evaluation
      const bulkEvaluation = await interviewService.bulkEvaluateAnswers(
        questions,
        data.answers,
        idealAnswers,
        resumeAnalysis // Pass resume analysis for context
      );
      
      // Update session with results
      if (sessionId) {
        await interviewService.updateInterviewSession(
          sessionId,
          data.answers,
          bulkEvaluation.evaluations,
          bulkEvaluation.overall_statistics.average_score
        );
      }
      
      setUserAnswers(data.answers);
      setEvaluations(bulkEvaluation.evaluations);
      setCurrentStep('completed');
      
      toast({
        title: "Interview Completed",
        description: `Overall Score: ${bulkEvaluation.overall_statistics.average_score.toFixed(1)}/10`,
      });
    } catch (error: any) {
      console.error('Error completing interview:', error);
      toast({
        title: "Evaluation Failed",
        description: "Interview completed but evaluation failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetInterview = () => {
    setCurrentStep('setup');
    setJobRole('');
    setQuestions([]);
    setIdealAnswers([]);
    setUserAnswers([]);
    setEvaluations([]);
    setResumeAnalysis(null);
    setSessionId('');
    setActiveTab('role');
  };

  // Show current user info for debugging
  const supabaseUserId = getSupabaseUserId();
  console.log('Current user state:', {
    clerkUser: user?.id,
    supabaseUserId,
    isAuthenticated: !!user,
    isStudent: isStudent()
  });

  if (currentStep === 'interview') {
    return (
      <DashboardLayout>
        <InterviewPrep
          questions={questions}
          onComplete={handleInterviewComplete}
          resumeAnalysis={resumeAnalysis}
          interviewType={interviewType}
        />
        <LiveCameraPreview />
      </DashboardLayout>
    );
  }

  if (currentStep === 'completed') {
    return (
      <DashboardLayout>
        <InterviewReport
          questions={questions}
          answers={userAnswers}
          evaluations={evaluations}
          idealAnswers={idealAnswers}
          resumeAnalysis={resumeAnalysis}
          interviewType={interviewType}
          onDone={resetInterview}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Interviews</h1>
            <p className="mt-2 text-gray-600">
              Create personalized mock interviews tailored to your needs
            </p>
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              User: {user?.firstName} {user?.lastName} | Supabase ID: {supabaseUserId?.slice(0, 8)}...
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {user?.emailAddresses?.[0]?.emailAddress}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Role-Based Interview
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Resume-Based Interview
              <Badge variant="outline" className="ml-2 text-xs">PRO</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-purple-600" />
                      Role-Based Interview
                    </CardTitle>
                    <CardDescription>
                      Generate specialized questions for a specific job role
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="questionCount">Number of Questions</Label>
                    <Select 
                      value={questionCount.toString()} 
                      onValueChange={(value) => setQuestionCount(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="6">6 Questions</SelectItem>
                        <SelectItem value="7">7 Questions</SelectItem>
                        <SelectItem value="8">8 Questions</SelectItem>
                        <SelectItem value="9">9 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobRole">Job Role or Position</Label>
                    <Input
                      id="jobRole"
                      placeholder="e.g., Senior React Developer, Product Manager"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    • Deep technical questions specific to the role
                  </p>
                  <p className="text-sm text-gray-600">
                    • Industry-specific behavioral scenarios
                  </p>
                  <p className="text-sm text-gray-600">
                    • Real-world challenges and best practices
                  </p>
                </div>
                
                <Button 
                  onClick={handleRoleBasedQuestions}
                  disabled={!jobRole.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Specialized Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Role-Specific Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume" className="space-y-4">
            <ProFeatureGuard 
              featureName="Resume-Based Interview"
              description="Upload your resume to get highly personalized interview questions based on your specific skills, experience, and career background. This premium feature creates the most relevant practice experience possible."
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-green-600" />
                        Resume-Based Interview
                      </CardTitle>
                      <CardDescription>
                        AI analyzes your resume to create personalized questions
                      </CardDescription>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">PRO</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resumeQuestionCount">Number of Questions</Label>
                    <Select 
                      value={questionCount.toString()} 
                      onValueChange={(value) => setQuestionCount(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="6">6 Questions</SelectItem>
                        <SelectItem value="7">7 Questions</SelectItem>
                        <SelectItem value="8">8 Questions</SelectItem>
                        <SelectItem value="9">9 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      • Questions based on your specific projects and experience
                    </p>
                    <p className="text-sm text-gray-600">
                      • Technology-specific queries matching your skills
                    </p>
                    <p className="text-sm text-gray-600">
                      • Career progression and achievement-focused questions
                    </p>
                  </div>
                  
                  <ResumeUpload
                    onAnalysisComplete={handleResumeAnalysisComplete}
                    onAnalysisResults={setResumeAnalysis}
                    questionCount={questionCount}
                  />
                </CardContent>
              </Card>
            </ProFeatureGuard>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              How Custom Interviews Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  1
                </div>
                <h4 className="font-medium mb-1">Choose Your Path</h4>
                <p className="text-sm text-gray-600">Select role-based or resume-based interview type</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  2
                </div>
                <h4 className="font-medium mb-1">AI Generates Questions</h4>
                <p className="text-sm text-gray-600">Advanced AI creates tailored questions with ideal answers</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  3
                </div>
                <h4 className="font-medium mb-1">Strict Professional Evaluation</h4>
                <p className="text-sm text-gray-600">Get honest feedback comparing your answers to ideal responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomInterviewsPage;