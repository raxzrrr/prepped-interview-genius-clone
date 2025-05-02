
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/ui/file-uploader';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
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
      
      console.log("Starting resume analysis with file:", file.substring(0, 100) + "...");
      
      // Validate file is a PDF
      if (!file.includes('application/pdf')) {
        throw new Error('Only PDF files are supported');
      }
      
      // Step 1: Analyze resume
      console.log("Calling analyzeResume API...");
      const analysis = await analyzeResume(file);
      
      console.log("Resume analysis response:", analysis);
      
      if (!analysis) {
        throw new Error('Failed to analyze resume');
      }
      
      // Notify parent component about analysis results
      console.log("Notifying parent about analysis results");
      onAnalysisResults(analysis);
      
      // Step 2: Generate interview questions based on resume skills
      const suggestedRole = analysis.suggested_role || 'Software Engineer';
      const skills = analysis.skills?.join(', ') || '';
      
      const generationPrompt = `${suggestedRole} with skills in ${skills}`;
      console.log("Generating interview questions with prompt:", generationPrompt);
      
      // Generate questions
      const questions = await generateInterviewQuestions(generationPrompt);
      console.log("Generated questions:", questions);
      
      // Create interview record in the database
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

      // Pass questions to parent component
      onAnalysisComplete(questions.map(q => q.question));
      
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      setError(error.message || 'Failed to analyze resume');
      toast({
        title: "Resume Analysis Failed",
        description: error.message || "An error occurred while analyzing your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
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
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-brand-purple animate-spin mb-4" />
              <h3 className="font-medium text-lg mb-2">Analyzing your resume</h3>
              <p className="text-gray-600 text-center max-w-md">
                Our AI is extracting key skills and experiences from your resume to generate tailored interview questions.
                This usually takes about 15-20 seconds.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="font-medium text-lg mb-2">Analysis Failed</h3>
              <p className="text-red-500 text-center mb-4">{error}</p>
              <Button onClick={analyzeResumeFile}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-medium text-lg mb-2">Resume Analysis Complete</h3>
              <p className="text-gray-600 text-center mb-4">
                Your resume has been successfully analyzed. Preparing your personalized interview...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
