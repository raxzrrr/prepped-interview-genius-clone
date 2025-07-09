
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Course } from '@/services/courseService';
import { uploadVideoFile } from '@/utils/fileUpload';
import { X, Upload, Link, Play } from 'lucide-react';

interface AddVideoFormProps {
  selectedCourse: Course;
  onAddVideo: (videoData: {
    title: string;
    description: string;
    video_url: string;
    duration: string;
    order_index: number;
    content_type: string;
    file_path?: string;
    file_size?: number;
    thumbnail_url?: string;
  }) => void;
  onCancel: () => void;
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({
  selectedCourse,
  onAddVideo,
  onCancel
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    order_index: 0
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('url');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order_index' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        // Auto-fill title if empty
        if (!formData.title) {
          setFormData(prev => ({
            ...prev,
            title: selectedFile.name.replace(/\.[^/.]+$/, '')
          }));
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a video file (MP4, WebM, etc.)",
          variant: "destructive"
        });
      }
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a video title",
        variant: "destructive"
      });
      return false;
    }

    if (activeTab === 'url') {
      if (!formData.video_url.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a video URL",
          variant: "destructive"
        });
        return false;
      }
    } else {
      if (!file) {
        toast({
          title: "Validation Error",
          description: "Please select a video file",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      let videoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: formData.video_url.trim(),
        duration: formData.duration.trim(),
        order_index: formData.order_index,
        content_type: activeTab,
        file_path: undefined as string | undefined,
        file_size: undefined as number | undefined,
        thumbnail_url: undefined as string | undefined
      };

      if (activeTab === 'file' && file) {
        console.log('Starting file upload for:', file.name);
        
        const uploadResult = await uploadVideoFile(file, (progress) => {
          setUploadProgress(progress);
        });

        console.log('Upload result:', uploadResult);

        videoData = {
          ...videoData,
          video_url: uploadResult.publicUrl,
          file_path: uploadResult.path,
          file_size: file.size,
          content_type: 'file'
        };
      }

      console.log('Submitting video data:', videoData);
      
      await onAddVideo(videoData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        video_url: '',
        duration: '',
        order_index: 0
      });
      setFile(null);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Add Video to "{selectedCourse.name}"</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center space-x-2">
                <Link className="w-4 h-4" />
                <span>Video URL</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="video_url">Video URL *</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/video.mp4 or YouTube URL"
                  required={activeTab === 'url'}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div>
                <Label htmlFor="video_file">Video File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    id="video_file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="video_file" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to select video file or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      MP4, WebM, AVI (max 100MB)
                    </p>
                  </label>
                </div>
                
                {file && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Play className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter video description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g. 10:30 or 5 minutes"
              />
            </div>
            <div>
              <Label htmlFor="order_index">Order</Label>
              <Input
                id="order_index"
                name="order_index"
                type="number"
                value={formData.order_index}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? 'Adding Video...' : 'Add Video'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddVideoForm;
