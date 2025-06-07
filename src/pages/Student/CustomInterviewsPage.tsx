import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Briefcase, Users, Target, FileText } from 'lucide-react';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import ResumeAnalysisResults from '@/components/Dashboard/ResumeAnalysisResults';
import { useInterviewApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const CustomInterviewsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { generateInterviewQuestions, saveInterview } = useInterviewApi();
  const { toast } = useToast();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  const [step, setStep] = useState<'setup' | 'upload' | 'interview' | 'report'>('setup');
  const [interviewType, setInterviewType] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [interviewDuration, setInterviewDuration] = useState<string>('15');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [interviewId, setInterviewId] = useState<string>();

  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview', icon: '💻' },
    { value: 'behavioral', label: 'Behavioral Interview', icon: '🤝' },
    { value: 'case-study', label: 'Case Study Interview', icon: '📊' },
    { value: 'leadership', label: 'Leadership Interview', icon: '👥' },
    { value: 'general', label: 'General Interview', icon: '💼' },
  ];

  const focusAreaOptions = [
    'Problem Solving', 'Communication Skills', 'Technical Skills', 'Leadership',
    'Teamwork', 'Project Management', 'Customer Service', 'Sales', 'Marketing',
    'Data Analysis', 'Strategic Thinking', 'Adaptability', 'Innovation'
  ];

  const addFocusArea = (area: string) => {
    if (!focusAreas.includes(area)) {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  const generateCustomQuestions = async () => {
    if (!interviewType || !jobTitle) {
      toast({
        title: "Missing Information",
        description: "Please select an interview type and enter a job title.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a comprehensive prompt based on user inputs
      let prompt = `Generate interview questions for a ${interviewType} interview for the position of ${jobTitle}`;
      
      if (companyName) {
        prompt += ` at ${companyName}`;
      }
      
      if (focusAreas.length > 0) {
        prompt += `. Focus on: ${focusAreas.join(', ')}`;
      }
      
      if (customQuestions) {
        prompt += `. Additional requirements: ${customQuestions}`;
      }
      
      prompt += `. Generate ${Math.ceil(parseInt(interviewDuration) / 3)} questions appropriate for a ${interviewDuration}-minute interview.`;

      console.log('Generating questions with prompt:', prompt);
      
      const generatedQuestions = await generateInterviewQuestions(prompt);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        const questionStrings = generatedQuestions.map(q => 
          typeof q === 'string' ? q : q.question || 'Question unavailable'
        );
        setQuestions(questionStrings);

        // Save the interview setup
        const interviewData = {
          title: `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview - ${jobTitle}`,
          job_title: jobTitle,
          company_name: companyName,
          interview_type: interviewType,
          duration: parseInt(interviewDuration),
          focus_areas: focusAreas,
          questions: questionStrings,
          status: 'in-progress',
          user_id: user.id
        };

        try {
          const savedInterviewId = await saveInterview(interviewData);
          setInterviewId(savedInterviewId);
          console.log('Interview setup saved with ID:', savedInterviewId);
        } catch (saveError) {
          console.error('Failed to save interview setup:', saveError);
          // Continue anyway - user can still do the interview
        }

        setStep('upload');
        
        toast({
          title: "Questions Generated!",
          description: `Generated ${questionStrings.length} questions for your ${interviewType} interview.`,
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
      setLoading(false);
    }
  };

  const handleResumeAnalysisComplete = (analysisData: any) => {
    console.log('Resume analysis completed:', analysisData);
    setResumeAnalysis(analysisData);
    // Don't automatically proceed to interview - let user review the analysis
  };

  const proceedToInterview = () => {
    setStep('interview');
  };

  const skipResumeUpload = () => {
    setStep('interview');
  };

  const handleInterviewComplete = (data: {
    questions: string[];
    answers: string[];
    facialAnalysis: any[];
    interviewId?: string;
  }) => {
    console.log('Interview completed with data:', data);
    setStep('report');
  };

  if (step === 'interview') {
    return (
      <DashboardLayout>
        <InterviewPrep
          questions={questions}
          onComplete={handleInterviewComplete}
          resumeAnalysis={resumeAnalysis}
          interviewId={interviewId}
        />
      </DashboardLayout>
    );
  }

  if (step === 'report') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Interview Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your interview has been completed and saved. You can view detailed reports in the Reports section.
              </p>
              <div className="flex space-x-4">
                <Button onClick={() => {
                  setStep('setup');
                  setQuestions([]);
                  setResumeAnalysis(null);
                  setInterviewId(undefined);
                  setJobTitle('');
                  setCompanyName('');
                  setInterviewType('');
                  setFocusAreas([]);
                  setCustomQuestions('');
                }}>
                  Start New Interview
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/reports'}>
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Interview Setup</h1>
          <p className="mt-2 text-gray-600">
            Create a personalized interview experience tailored to your target role
          </p>
        </div>

        {step === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Setup Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interview Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Interview Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interviewTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={interviewType === type.value ? "default" : "outline"}
                        onClick={() => setInterviewType(type.value)}
                        className="h-16 flex flex-col items-center justify-center"
                      >
                        <span className="text-2xl mb-1">{type.icon}</span>
                        <span className="text-sm">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Software Engineer, Product Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name (Optional)</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Google, Microsoft"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Interview Duration</Label>
                    <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Focus Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {focusAreaOptions.map((area) => (
                        <Button
                          key={area}
                          variant="outline"
                          size="sm"
                          onClick={() => addFocusArea(area)}
                          disabled={focusAreas.includes(area)}
                          className="text-xs"
                        >
                          {area}
                        </Button>
                      ))}
                    </div>
                    {focusAreas.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Focus Areas:</Label>
                        <div className="flex flex-wrap gap-2">
                          {focusAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="flex items-center">
                              {area}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => removeFocusArea(area)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Requirements (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customQuestions}
                    onChange={(e) => setCustomQuestions(e.target.value)}
                    placeholder="Any specific topics, technologies, or scenarios you'd like to focus on..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500">Type</Label>
                    <p className="font-medium">
                      {interviewType ? interviewTypes.find(t => t.value === interviewType)?.label : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Position</Label>
                    <p className="font-medium">{jobTitle || 'Not specified'}</p>
                  </div>
                  {companyName && (
                    <div>
                      <Label className="text-sm text-gray-500">Company</Label>
                      <p className="font-medium">{companyName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-500">Duration</Label>
                    <p className="font-medium">{interviewDuration} minutes</p>
                  </div>
                  {focusAreas.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-500">Focus Areas</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {focusAreas.map((area) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button 
                onClick={generateCustomQuestions}
                disabled={loading || !interviewType || !jobTitle}
                className="w-full"
                size="lg"
              >
                {loading ? 'Generating...' : 'Generate Questions'}
              </Button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Resume Upload (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Upload your resume to get personalized feedback and questions tailored to your background.
                  </p>
                  <ResumeUpload 
                    onAnalysisResults={handleResumeAnalysisComplete}
                  />
                  
                  {resumeAnalysis && (
                    <div className="mt-6">
                      <ResumeAnalysisResults analysis={resumeAnalysis} />
                      <div className="flex justify-center space-x-4 mt-4">
                        <Button onClick={proceedToInterview}>
                          Start Interview with Analysis
                        </Button>
                        <Button variant="outline" onClick={skipResumeUpload}>
                          Start Interview without Resume
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!resumeAnalysis && (
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={skipResumeUpload}>
                        Skip Resume Upload
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomInterviewsPage;
