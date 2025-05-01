
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Upload, FileText, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';

interface ResumeUploadProps {
  onAnalysisComplete: (questions: string[]) => void;
  onResumeAnalysis?: (analysis: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onAnalysisComplete, onResumeAnalysis }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const { generateInterviewQuestions, analyzeResume } = useInterviewApi();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF document only.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Convert file to base64 for processing
      const base64File = await convertFileToBase64(file);
      setUploading(false);
      setUploadComplete(true);
      setAnalyzing(true);
      
      // First, analyze the resume
      const resumeAnalysis = await analyzeResume(base64File);
      
      if (onResumeAnalysis && resumeAnalysis) {
        onResumeAnalysis(resumeAnalysis);
      }
      
      // Generate interview questions based on the resume content
      const jobRole = resumeAnalysis?.suggested_role || "Software Engineer";
      const questions = await generateInterviewQuestions(jobRole);
      const questionTexts = questions.map(q => q.question);
      
      setAnalyzing(false);
      
      if (questionTexts.length === 0) {
        throw new Error('Failed to generate questions');
      }
      
      onAnalysisComplete(questionTexts);
      
      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed and interview questions have been generated!",
      });
    } catch (error) {
      console.error('Error processing resume:', error);
      setUploading(false);
      setAnalyzing(false);
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your resume. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadComplete(false);
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your resume in PDF format for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 mr-3 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Important Note</h4>
            <p className="text-sm text-amber-700">
              Do not include personal details like email ID, phone number, education background, or address in your resume.
            </p>
          </div>
        </div>
        
        {!uploadComplete ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-300 hover:border-brand-purple transition-colors">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Upload 
              className="w-12 h-12 mb-4 text-gray-400"
              strokeWidth={1.5}
            />
            <label 
              htmlFor="resume-upload" 
              className="mb-2 text-sm font-medium text-brand-purple cursor-pointer hover:underline"
            >
              Click to upload
            </label>
            <p className="text-xs text-gray-500">
              PDF files only (max. 5MB)
            </p>
            {file && (
              <div className="flex items-center mt-4 space-x-2 text-sm text-gray-700">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 rounded-lg border-green-200 bg-green-50">
            <div className="p-2 mb-4 text-white bg-green-500 rounded-full">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Resume Uploaded Successfully
            </h3>
            <p className="text-sm text-gray-600">
              {file?.name}
            </p>
            <Button 
              variant="ghost"
              onClick={resetUpload}
              className="mt-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Upload Different Resume
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || analyzing || uploadComplete}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              Uploading...
            </>
          ) : analyzing ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              Analyzing Resume...
            </>
          ) : 'Upload & Analyze'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;
