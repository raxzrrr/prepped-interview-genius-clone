import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, User } from 'lucide-react';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';

type InterviewType = 'resume' | 'prep' | 'report';

const CustomInterviewsPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<InterviewType>('resume');
  const [resumeFile, setResumeFile] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string | undefined>();
  const [answers, setAnswers] = useState<string[]>([]);
  const [facialData, setFacialData] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setResumeFile(result);
        setCurrentView('resume');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysisComplete = (generatedQuestions: string[]) => {
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

  const startNewInterview = () => {
    setCurrentView('resume');
    setResumeFile('');
    setQuestions([]);
    setAnswers([]);
    setFacialData([]);
    setAnalysisResults(null);
    setInterviewId(undefined);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Interviews</h1>
        <p className="mt-2 text-gray-600">
          Get personalized interview questions based on your resume
        </p>
      </div>

      <div className="grid gap-6">
        {!resumeFile ? (
          <Card className="border-2 border-dashed border-gray-300 hover:border-brand-purple transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Upload className="mr-2 h-6 w-6 text-brand-purple" />
                Upload Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Upload your resume to get personalized interview questions tailored to your experience and skills.
              </p>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload">
                  <Button asChild className="cursor-pointer">
                    <span>
                      <FileText className="mr-2 h-4 w-4" />
                      Choose PDF File
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-500">
                  Only PDF files are supported. Max file size: 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResumeUpload
            file={resumeFile}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisResults={handleAnalysisResults}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-brand-purple" />
              How Resume-Based Interviews Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-purple text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Upload Your Resume</h3>
                  <p className="text-sm text-gray-600">
                    Upload your PDF resume and our AI will analyze your skills, experience, and background.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-purple text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Personalized Questions</h3>
                  <p className="text-sm text-gray-600">
                    Get interview questions specifically tailored to your background and the roles you're targeting.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-purple text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Practice & Get Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Practice your answers with video recording and receive detailed feedback on your performance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomInterviewsPage;
