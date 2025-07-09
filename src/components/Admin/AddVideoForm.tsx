
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Link, Video, Loader2, X } from 'lucide-react';
import { Course } from '@/services/courseService';
import { uploadVideoFile, generateThumbnail, UploadProgress } from '@/utils/fileUpload';

interface AddVideoFormProps {
  selectedCourse: Course;
  onAddVideo: (video: { 
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

const AddVideoForm: React.FC<AddVideoFormProps> = ({ selectedCourse, onAddVideo, onCancel }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    order_index: 0
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-fill title from filename if empty
      if (!newVideo.title) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        setNewVideo(prev => ({ ...prev, title: nameWithoutExtension }));
      }
    }
  };

  const handleSubmitUrl = () => {
    if (!newVideo.title || !newVideo.video_url) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and video URL",
        variant: "destructive"
      });
      return;
    }

    onAddVideo({
      ...newVideo,
      content_type: 'url'
    });
    
    resetForm();
  };

  const handleSubmitFile = async () => {
    if (!newVideo.title || !selectedFile) {
      toast({
        title: "Missing Information", 
        description: "Please provide both title and video file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Generate thumbnail
      let thumbnailUrl;
      try {
        thumbnailUrl = await generateThumbnail(selectedFile);
      } catch (error) {
        console.log('Could not generate thumbnail:', error);
      }

      // Upload file
      const uploadResult = await uploadVideoFile(
        selectedFile, 
        selectedCourse.id,
        (progress) => setUploadProgress(progress)
      );

      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      // Add video with file information
      onAddVideo({
        ...newVideo,
        video_url: uploadResult.url,
        content_type: 'file',
        file_path: uploadResult.path,
        file_size: selectedFile.size,
        thumbnail_url: thumbnailUrl
      });

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const resetForm = () => {
    setNewVideo({ title: '', description: '', video_url: '', duration: '', order_index: 0 });
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Video to "{selectedCourse.name}"</CardTitle>
        <CardDescription>Upload video files or add video links to this course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Video Link
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          {/* Common fields */}
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="videoTitle">Video Title *</Label>
              <Input
                id="videoTitle"
                value={newVideo.title}
                onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                placeholder="Enter video title"
              />
            </div>
            <div>
              <Label htmlFor="videoDescription">Video Description</Label>
              <Textarea
                id="videoDescription"
                value={newVideo.description}
                onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                placeholder="Enter video description (optional)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={newVideo.duration}
                onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                placeholder="e.g., 15:30 or 1h 20m"
              />
            </div>
            <div>
              <Label htmlFor="videoOrder">Order Index</Label>
              <Input
                id="videoOrder"
                type="number"
                value={newVideo.order_index}
                onChange={(e) => setNewVideo({...newVideo, order_index: parseInt(e.target.value) || 0})}
                placeholder="Enter order index"
              />
            </div>
          </div>

          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                value={newVideo.video_url}
                onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                placeholder="Enter YouTube URL or embed link"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSubmitUrl} disabled={uploading}>
                Add Video Link
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="videoFile">Video File *</Label>
              <div className="mt-2">
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-600">
                        Choose a video file to upload
                      </p>
                      <p className="text-sm text-gray-500">
                        MP4, WebM, MOV, AVI up to 500MB
                      </p>
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={handleFileSelect}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Video className="w-8 h-8 text-brand-purple" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                        disabled={uploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {previewUrl && (
                      <div className="aspect-video w-full max-w-md mx-auto">
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{uploadProgress.message}</span>
                  <span>{uploadProgress.progress}%</span>
                </div>
                <Progress value={uploadProgress.progress} className="w-full" />
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={handleSubmitFile} 
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Video'
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AddVideoForm;
