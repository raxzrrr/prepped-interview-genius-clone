
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileChange: (file: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileChange,
  accept = 'application/pdf',
  maxSize = 5, // Default 5MB
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    if (accept && !accept.includes(file.type)) {
      setError(`File type not accepted. Please upload a ${accept.split('/')[1].toUpperCase()} file.`);
      return false;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    setFile(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onFileChange(e.target.result.toString());
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('Error reading file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-300'
        } ${error ? 'border-red-500 bg-red-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple"></div>
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)}MB
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                onFileChange(null);
              }}
            >
              Clear
            </Button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium mb-2">
              Drag and drop your file here
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse (max {maxSize}MB)
            </p>
            <Button variant="outline" size="sm">
              Select File
            </Button>
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}

        <input
          type="file"
          id="file-input"
          className="hidden"
          accept={accept}
          onChange={handleFileSelect}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Supported format: {accept.split('/')[1].toUpperCase()}
      </p>
    </div>
  );
};
