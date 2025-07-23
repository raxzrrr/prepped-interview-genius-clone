
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, FileText, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import ProFeatureGuard from '@/components/ProFeatureGuard';

const CustomInterviewsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { generateInterviewQuestions } = useInterviewApi();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'completed'>('setup');
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('role');

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

    try {
      setIsGenerating(true);
      
      console.log("Generating questions for role:", jobRole);
      const questionData = await generateInterviewQuestions(jobRole);
      
      if (questionData && questionData.questions && questionData.questions.length > 0) {
        setQuestions(questionData.questions);
        setCurrentStep('interview');
        
        toast({
          title: "Professional Questions Generated",
          description: `Generated ${questionData.questions.length} industry-standard questions for ${jobRole}`,
        });
      } else {
        throw new Error('No questions were generated');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResumeAnalysisComplete = (generatedQuestions: string[]) => {
    setQuestions(generatedQuestions);
    setCurrentStep('interview');
  };

  const handleInterviewComplete = (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[],
    interviewId?: string 
  }) => {
    console.log('Interview completed with data:', data);
    
    // Save report to localStorage for reports page
    try {
      const reportData = {
        questions: data.questions,
        answers: data.answers,
        evaluations: data.evaluations,
        overallScore: data.evaluations[0]?.overallScore || 0,
        overallGrade: data.evaluations[0]?.overallGrade || 'N/A',
        recommendation: data.evaluations[0]?.recommendation || 'NO HIRE',
        reportData: { resumeAnalysis }
      };
      
      // Use localStorage directly since hook may not be available here
      const userId = 'current_user'; // You can get this from auth context
      const existingReports = JSON.parse(localStorage.getItem(`interview_reports_${userId}`) || '[]');
      const newReport = {
        id: `report_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...reportData
      };
      
      const updatedReports = [newReport, ...existingReports];
      localStorage.setItem(`interview_reports_${userId}`, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error saving report:', error);
    }
    
    setQuestions(data.questions);
    setAnswers(data.answers);
    setEvaluations(data.evaluations || []);
    setFacialAnalysis(data.facialAnalysis);
    setCurrentStep('completed');
  };

  const resetInterview = () => {
    setCurrentStep('setup');
    setJobRole('');
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setFacialAnalysis([]);
    setResumeAnalysis(null);
    setActiveTab('role');
  };

  if (currentStep === 'interview') {
    return (
      <DashboardLayout>
        <InterviewPrep
          questions={questions}
          onComplete={handleInterviewComplete}
          resumeAnalysis={resumeAnalysis}
        />
      </DashboardLayout>
    );
  }

  if (currentStep === 'completed') {
    return (
      <DashboardLayout>
        <InterviewReport
          questions={questions}
          answers={answers}
          evaluations={evaluations}
          facialAnalysis={facialAnalysis}
          resumeAnalysis={resumeAnalysis}
          onDone={resetInterview}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Interviews</h1>
          <p className="mt-2 text-gray-600">
            Create personalized mock interviews tailored to your needs
          </p>
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
                      <Briefcase className="mr-2 h-5 w-5 text-brand-purple" />
                      Role-Based Interview
                    </CardTitle>
                    <CardDescription>
                      Generate questions based on a specific job role
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jobRole">Job Role or Position</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Frontend Developer, Product Manager, Data Scientist"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    disabled={isGenerating}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the specific role you want to practice for
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
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Interview Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume" className="space-y-4">
            <ProFeatureGuard 
              featureName="Resume-Based Interview"
              description="Upload your resume to get personalized interview questions based on your skills and experience. This premium feature helps you practice with questions tailored specifically to your background."
            >
              <ResumeUpload
                onAnalysisComplete={handleResumeAnalysisComplete}
                onAnalysisResults={setResumeAnalysis}
              />
            </ProFeatureGuard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomInterviewsPage;
