
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, FileText, CheckCircle, Loader2, XCircle, Upload } from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface ResumeUploadProps {
  file?: string;
  isLoading?: boolean;
  onAnalysisComplete?: (questions: string[]) => void;
  onAnalysisResults?: (analysis: any) => void;
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
  const [progress, setProgress] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(file || null);
  const { toast } = useToast();
  const { generateInterviewQuestions, analyzeResume } = useInterviewApi();
  const { user } = useAuth();

  useEffect(() => {
    if (uploadedFile && !analyzing && !success && !error) {
      analyzeResumeFile();
    }
  }, [uploadedFile]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFile(result);
      setError(null);
      setSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const analyzeResumeFile = async () => {
    if (!user || !uploadedFile) {
      setError('User not authenticated or no file uploaded');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setSuccess(false);
      setProgress('Validating file...');
      
      console.log("Starting resume analysis...");
      
      if (!uploadedFile.includes('application/pdf')) {
        throw new Error('Only PDF files are supported');
      }
      
      // Step 1: Analyze resume
      setProgress('Analyzing your resume...');
      console.log("Calling analyzeResume API...");
      const analysis = await analyzeResume(uploadedFile);
      
      if (!analysis) {
        throw new Error('Failed to analyze resume - no response from API. Please check your API configuration.');
      }
      
      console.log("Resume analysis successful:", analysis);
      onAnalysisResults?.(analysis);
      
      // Step 2: Generate interview questions based on resume analysis
      setProgress('Generating personalized interview questions...');
      const suggestedRole = analysis.suggested_role || 'Software Engineer';
      const skills = analysis.skills?.join(', ') || '';
      const generationPrompt = `${suggestedRole} with skills in ${skills}`;
      
      console.log("Generating interview questions with prompt:", generationPrompt);
      const questions = await generateInterviewQuestions(generationPrompt);
      
      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate interview questions');
      }
      
      console.log("Generated questions:", questions);

      setProgress('Complete!');
      setSuccess(true);
      onAnalysisComplete?.(questions.map(q => q.question));
      
      toast({
        title: "Resume Analysis Complete",
        description: "Your personalized interview questions are ready!",
      });
      
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
    setError(null);
    setSuccess(false);
    setProgress('');
    if (uploadedFile) {
      analyzeResumeFile();
    }
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
          {!uploadedFile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload your resume (PDF only)
                    </span>
                  </label>
                  <input
                    id="resume-upload"
                    name="resume-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </div>
                <Button className="mt-4" onClick={() => document.getElementById('resume-upload')?.click()}>
                  Choose File
                </Button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-brand-purple animate-spin mb-4" />
              <h3 className="font-medium text-lg mb-2">Analyzing your resume</h3>
              <p className="text-gray-600 text-center max-w-md mb-2">
                {progress || 'Our AI is extracting key skills and experiences from your resume to generate tailored interview questions.'}
              </p>
              <div className="text-sm text-gray-500">
                This may take a few moments...
              </div>
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
                <p>• Make sure you're logged in properly</p>
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
              <p className="text-sm text-green-600 font-medium">
                Ready to start your interview!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
