import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, User, Briefcase, ArrowRight } from 'lucide-react';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { generateConsistentUUID } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';

type InterviewType = 'resume' | 'prep' | 'report' | 'selection';

const CustomInterviewsPage: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<InterviewType>('selection');
  const [resumeFile, setResumeFile] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string | undefined>();
  const [answers, setAnswers] = useState<string[]>([]);
  const [facialData, setFacialData] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [usageData, setUsageData] = useState<{ custom_interviews: number, resume_interviews: number }>({ 
    custom_interviews: 0, 
    resume_interviews: 0 
  });
  
  // Role-based interview state
  const [customRole, setCustomRole] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  const { generateInterviewQuestions, saveInterview } = useInterviewApi();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;
    
    try {
      const supabaseUserId = generateConsistentUUID(user.id);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      console.log('Fetching usage data for user:', supabaseUserId);
      
      const { data: interviews, error } = await supabase
        .from('interviews')
        .select('id, title, created_at')
        .eq('user_id', supabaseUserId)
        .gte('created_at', firstDayOfMonth.toISOString());
      
      if (error) {
        console.error('Error fetching usage data:', error);
        return;
      }
      
      console.log('Raw interviews data:', interviews);
      
      // Count custom and resume-based interviews more accurately
      const custom = interviews?.filter(i => {
        const title = i.title?.toLowerCase() || '';
        return title.includes('custom') && !title.includes('resume');
      }).length || 0;
      
      const resume = interviews?.filter(i => {
        const title = i.title?.toLowerCase() || '';
        return title.includes('resume') || title.includes('resume-based');
      }).length || 0;
      
      console.log('Usage counts - Custom:', custom, 'Resume:', resume);
      
      setUsageData({ 
        custom_interviews: custom,
        resume_interviews: resume
      });
      
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }

      // Check resume interview limit before processing
      if (usageData.resume_interviews >= 10) {
        toast({
          title: "Monthly Limit Reached",
          description: "You have reached your monthly limit of 10 resume-based interviews.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setResumeFile(result);
        setCurrentView('resume');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeAnalysisComplete = async (generatedQuestions: string[]) => {
    if (!user) return;

    try {
      // Save resume-based interview session
      const newInterviewData = {
        user_id: user.id,
        title: 'Resume-based Interview',
        questions: generatedQuestions,
        status: 'in-progress'
      };
      
      const savedInterviewId = await saveInterview(newInterviewData);
      setInterviewId(savedInterviewId);
      setQuestions(generatedQuestions);
      setCurrentView('prep');
      
      // Refresh usage data
      fetchUsageData();
      
    } catch (error) {
      console.error('Error saving resume interview:', error);
      setQuestions(generatedQuestions);
      setCurrentView('prep');
    }
  };

  const handleAnalysisResults = (analysis: any) => {
    setAnalysisResults(analysis);
  };

  const handleInterviewComplete = (interviewAnswers: string[], facialAnalysisData: any[], completedInterviewId?: string) => {
    setAnswers(interviewAnswers);
    setFacialData(facialAnalysisData);
    // Use the passed interviewId or fall back to the stored one
    if (completedInterviewId) {
      setInterviewId(completedInterviewId);
    }
    setCurrentView('report');
    fetchUsageData(); // Refresh usage data after completing interview
  };

  const handleRoleBasedInterview = async () => {
    if (!customRole.trim()) {
      toast({
        title: "Role Required",
        description: "Please enter the role you want to interview for.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start an interview.",
        variant: "destructive",
      });
      return;
    }

    if (usageData.custom_interviews >= 10) {
      toast({
        title: "Monthly Limit Reached",
        description: "You have reached your monthly limit of 10 custom interviews.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      
      const prompt = roleDescription.trim() 
        ? `${customRole} - ${roleDescription}`
        : customRole;
      
      const generatedQuestions = await generateInterviewQuestions(prompt);
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Failed to generate interview questions');
      }

      // Save interview session with proper title
      try {
        const newInterviewData = {
          user_id: user.id,
          title: `Custom ${customRole} Interview`,
          questions: generatedQuestions.map(q => q.question),
          status: 'in-progress'
        };
        
        const savedInterviewId = await saveInterview(newInterviewData);
        setInterviewId(savedInterviewId);
        
        // Refresh usage data immediately
        fetchUsageData();
        
      } catch (saveError) {
        console.error("Error saving interview:", saveError);
        toast({
          title: "Warning",
          description: "Interview questions generated but failed to save session. You can still proceed.",
          variant: "destructive",
        });
      }

      setQuestions(generatedQuestions.map(q => q.question));
      setCurrentView('prep');
      
      toast({
        title: "Questions Generated",
        description: `Generated ${generatedQuestions.length} questions for ${customRole} role.`,
      });
      
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({
        title: "Failed to Generate Questions",
        description: error.message || "An error occurred while generating interview questions.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startNewInterview = () => {
    setCurrentView('selection');
    setResumeFile('');
    setQuestions([]);
    setAnswers([]);
    setFacialData([]);
    setAnalysisResults(null);
    setInterviewId(undefined);
    setCustomRole('');
    setRoleDescription('');
    fetchUsageData(); // Refresh usage data when starting new interview
  };

  if (currentView === 'prep' && questions.length > 0) {
    return (
      <DashboardLayout>
        <InterviewPrep
          questions={questions}
          interviewId={interviewId}
          onInterviewComplete={handleInterviewComplete}
        />
      </DashboardLayout>
    );
  }

  if (currentView === 'report') {
    return (
      <DashboardLayout>
        <InterviewReport
          questions={questions}
          answers={answers}
          facialAnalysis={facialData}
          interviewId={interviewId}
          onDone={startNewInterview}
        />
      </DashboardLayout>
    );
  }

  if (currentView === 'resume' && resumeFile) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Resume Analysis</h1>
            <p className="text-muted-foreground">
              Analyzing your resume to generate personalized interview questions
            </p>
          </div>
          
          <ResumeUpload
            file={resumeFile}
            onAnalysisComplete={handleResumeAnalysisComplete}
            onAnalysisResults={handleAnalysisResults}
          />
          
          <div className="text-center">
            <Button variant="outline" onClick={startNewInterview}>
              Back to Interview Options
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Custom Interviews</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your interview type and get personalized questions tailored to your needs
          </p>
        </div>

        {/* Monthly Limits Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              Monthly Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Custom Interviews</span>
                  <span className={`text-sm font-medium ${usageData.custom_interviews >= 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {usageData.custom_interviews}/10
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${usageData.custom_interviews >= 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((usageData.custom_interviews / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Resume-based Interviews</span>
                  <span className={`text-sm font-medium ${usageData.resume_interviews >= 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {usageData.resume_interviews}/10
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${usageData.resume_interviews >= 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((usageData.resume_interviews / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <p>Limits reset every 30 days</p>
            </div>
          </CardContent>
        </Card>

        {/* Interview Options */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resume-Based Interview */}
          <Card className={`border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg ${usageData.resume_interviews >= 10 ? 'opacity-60' : ''}`}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Resume-Based Interview</CardTitle>
              <p className="text-muted-foreground">
                Upload your resume and get questions tailored to your experience
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="font-medium">Upload Your Resume</p>
                    <p className="text-sm text-muted-foreground">PDF files only, max 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={usageData.resume_interviews >= 10}
                  />
                  <Label htmlFor="resume-upload">
                    <Button asChild className="mt-4 cursor-pointer" disabled={usageData.resume_interviews >= 10}>
                      <span>
                        <FileText className="mr-2 h-4 w-4" />
                        {usageData.resume_interviews >= 10 ? 'Monthly Limit Reached' : 'Choose PDF File'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <span>AI analyzes your skills and experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <span>Generates personalized interview questions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <span>Practice and receive detailed feedback</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-Based Interview */}
          <Card className={`border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg ${usageData.custom_interviews >= 10 ? 'opacity-60' : ''}`}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Role-Based Interview</CardTitle>
              <p className="text-muted-foreground">
                Enter a specific role and get targeted interview questions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full"
                    disabled={usageData.custom_interviews >= 10}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add specific skills, technologies, or requirements for the role..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full min-h-[80px] resize-none"
                    disabled={usageData.custom_interviews >= 10}
                  />
                </div>
                
                <Button 
                  onClick={handleRoleBasedInterview}
                  disabled={!customRole.trim() || isGeneratingQuestions || usageData.custom_interviews >= 10}
                  className="w-full"
                  size="lg"
                >
                  {usageData.custom_interviews >= 10 ? (
                    'Monthly Limit Reached'
                  ) : isGeneratingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      Start Interview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <span>Enter your target role and details</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <span>AI creates role-specific questions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <span>Practice with video recording</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <User className="mr-2 h-5 w-5 text-primary" />
              Why Choose Custom Interviews?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Personalized Content</h3>
                <p className="text-sm text-muted-foreground">
                  Questions tailored specifically to your background or target role
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Industry Relevant</h3>
                <p className="text-sm text-muted-foreground">
                  Real interview questions commonly asked in your field
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Detailed Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analysis of your responses and performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomInterviewsPage;
