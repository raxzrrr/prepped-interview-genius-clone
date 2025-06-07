
import React, { useState } from 'react';
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
  
  // Role-based interview state
  const [customRole, setCustomRole] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  const { generateInterviewQuestions, saveInterview } = useInterviewApi();
  const { user } = useAuth();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setResumeFile(result);
        setCurrentView('resume');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeAnalysisComplete = (generatedQuestions: string[]) => {
    setQuestions(generatedQuestions);
    setCurrentView('prep');
  };

  const handleAnalysisResults = (analysis: any) => {
    setAnalysisResults(analysis);
  };

  const handleInterviewComplete = (interviewAnswers: string[], facialAnalysisData: any[]) => {
    setAnswers(interviewAnswers);
    setFacialData(facialAnalysisData);
    setCurrentView('report');
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

    try {
      setIsGeneratingQuestions(true);
      
      const prompt = roleDescription.trim() 
        ? `${customRole} - ${roleDescription}`
        : customRole;
      
      const generatedQuestions = await generateInterviewQuestions(prompt);
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Failed to generate interview questions');
      }

      // Save interview session
      try {
        const newInterviewData = {
          user_id: user.id,
          title: `Custom ${customRole} Interview`,
          questions: generatedQuestions.map(q => q.question),
          status: 'in-progress'
        };
        
        const savedInterviewId = await saveInterview(newInterviewData);
        setInterviewId(savedInterviewId);
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
  };

  if (currentView === 'prep' && questions.length > 0) {
    return (
      <InterviewPrep
        questions={questions}
        interviewId={interviewId}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  if (currentView === 'report') {
    return (
      <InterviewReport
        questions={questions}
        answers={answers}
        facialAnalysis={facialData}
        onDone={startNewInterview}
      />
    );
  }

  if (currentView === 'resume' && resumeFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Custom Interviews</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your interview type and get personalized questions tailored to your needs
          </p>
        </div>

        {/* Interview Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Resume-Based Interview */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
                  />
                  <Label htmlFor="resume-upload">
                    <Button asChild className="mt-4 cursor-pointer">
                      <span>
                        <FileText className="mr-2 h-4 w-4" />
                        Choose PDF File
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
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
                  />
                </div>
                
                <Button 
                  onClick={handleRoleBasedInterview}
                  disabled={!customRole.trim() || isGeneratingQuestions}
                  className="w-full"
                  size="lg"
                >
                  {isGeneratingQuestions ? (
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
    </div>
  );
};

export default CustomInterviewsPage;
