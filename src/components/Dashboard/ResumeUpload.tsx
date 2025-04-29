
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
import { Upload, FileText, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ResumeUploadProps {
  onAnalysisComplete: (questions: string[]) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || 
          selectedFile.type === 'application/msword' || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUploading(false);
    setUploadComplete(true);
    setAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAnalyzing(false);
    
    // Generate mock interview questions
    const mockQuestions = [
      "Tell me about your experience with React and how you've used it in previous projects.",
      "Describe a challenging problem you faced in your last role and how you solved it.",
      "How do you handle tight deadlines and competing priorities?",
      "What attracted you to apply for this position?",
      "Can you walk me through your process for implementing new features?",
      "How do you stay updated with the latest industry trends and technologies?",
      "Describe your experience working in agile development environments.",
      "Tell me about a time when you had to learn a new technology quickly.",
      "How do you approach testing and ensuring code quality?",
      "Where do you see yourself professionally in 5 years?",
      "What is your greatest professional achievement?",
      "How do you handle constructive criticism?",
      "Describe your communication style when working with cross-functional teams.",
      "What motivates you in your work?",
      "Tell me about a time when you had to make a difficult decision with limited information."
    ];
    
    onAnalysisComplete(mockQuestions);
    
    toast({
      title: "Analysis Complete",
      description: "Your resume has been analyzed and interview questions have been generated!",
    });
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadComplete(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your resume in PDF or Word format for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadComplete ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-300 hover:border-brand-purple transition-colors">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.doc,.docx"
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
              PDF or Word files (max. 5MB)
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
          {uploading ? 'Uploading...' : analyzing ? 'Analyzing Resume...' : 'Upload & Analyze'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;
