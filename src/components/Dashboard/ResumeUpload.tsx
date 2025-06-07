
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, FileText, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface ResumeUploadProps {
  file: string;
  isLoading?: boolean;
  onAnalysisComplete: (questions: string[]) => void;
  onAnalysisResults: (analysis: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ 
  file, 
  isLoading = false, 
  onAnalysisComplete,
  onAnalysisResults
}) => {
  const [analyzing, setAnalyzing] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { generateInterviewQuestions, analyzeResume, saveInterview } = useInterviewApi();
  const { user } = useAuth();

  useEffect(() => {
    if (file) {
      analyzeResumeFile();
    }
  }, [file]);

  const analyzeResumeFile = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setSuccess(false);
      
      console.log("Starting resume analysis...");
      
      if (!file.includes('application/pdf')) {
        throw new Error('Only PDF files are supported');
      }
      
      // Step 1: Analyze resume
      console.log("Calling analyzeResume API...");
      const analysis = await analyzeResume(file);
      
      if (!analysis) {
        throw new Error('Failed to analyze resume - no response from API');
      }
      
      console.log("Resume analysis successful:", analysis);
      onAnalysisResults(analysis);
      
      // Step 2: Generate interview questions based on resume analysis
      const suggestedRole = analysis.suggested_role || 'Software Engineer';
      const skills = analysis.skills?.join(', ') || '';
      const generationPrompt = `${suggestedRole} with skills in ${skills}`;
      
      console.log("Generating interview questions with prompt:", generationPrompt);
      const questions = await generateInterviewQuestions(generationPrompt);
      
      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate interview questions');
      }
      
      console.log("Generated questions:", questions);
      
      // Step 3: Create interview record in the database
      if (user) {
        try {
          const newInterviewData = {
            user_id: user.id,
            title: `Resume-based ${suggestedRole} Interview`,
            questions: questions.map(q => q.question),
            status: 'in-progress'
          };
          
          console.log("Saving interview with data:", newInterviewData);
          const interviewId = await saveInterview(newInterviewData);
          console.log('Created interview with ID:', interviewId);
        } catch (err) {
          console.error("Error saving interview:", err);
          // Continue with the flow even if saving fails
        }
      }

      setSuccess(true);
      onAnalysisComplete(questions.map(q => q.question));
      
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      setError(error.message || 'Failed to analyze resume');
      toast({
        title: "Resume Analysis Failed",
        description: error.message || "An error occurred while analyzing your resume. Please check your API configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const retryAnalysis = () => {
    analyzeResumeFile();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-brand-purple" />
          Resume Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyzing && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-brand-purple animate-spin mb-4" />
              <h3 className="font-medium text-lg mb-2">Analyzing your resume</h3>
              <p className="text-gray-600 text-center max-w-md">
                Our AI is extracting key skills and experiences from your resume to generate tailored interview questions.
                This process requires a valid API connection.
              </p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="font-medium text-lg mb-2">Analysis Failed</h3>
              <p className="text-red-500 text-center mb-4 max-w-md">{error}</p>
              <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
                <p>• Ensure your Gemini API key is properly configured</p>
                <p>• Check that the uploaded file is a valid PDF</p>
                <p>• Verify your internet connection</p>
              </div>
              <Button onClick={retryAnalysis} variant="outline">
                Try Again
              </Button>
            </div>
          )}
          
          {success && !analyzing && !error && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-medium text-lg mb-2">Resume Analysis Complete</h3>
              <p className="text-gray-600 text-center mb-4">
                Your resume has been successfully analyzed and personalized interview questions have been generated.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
