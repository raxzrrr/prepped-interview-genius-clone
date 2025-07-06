
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Course } from '@/services/courseService';

interface AddVideoFormProps {
  selectedCourse: Course;
  onAddVideo: (video: { title: string; description: string; video_url: string; duration: string; order_index: number }) => void;
  onCancel: () => void;
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({ selectedCourse, onAddVideo, onCancel }) => {
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    order_index: 0
  });

  const handleSubmit = () => {
    if (!newVideo.title || !newVideo.video_url) {
      return;
    }
    onAddVideo(newVideo);
    setNewVideo({ title: '', description: '', video_url: '', duration: '', order_index: 0 });
  };

  const handleCancel = () => {
    setNewVideo({ title: '', description: '', video_url: '', duration: '', order_index: 0 });
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Video to "{selectedCourse.name}"</CardTitle>
        <CardDescription>Add educational video content to this course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          />
        </div>
        <div>
          <Label htmlFor="videoUrl">Video URL *</Label>
          <Input
            id="videoUrl"
            value={newVideo.video_url}
            onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
            placeholder="Enter YouTube URL or embed link"
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
        <div className="flex space-x-2">
          <Button onClick={handleSubmit}>Add Video</Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddVideoForm;
