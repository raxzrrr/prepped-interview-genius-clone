
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { CourseVideo } from '@/services/courseService';

interface VideoListItemProps {
  video: CourseVideo;
  isEditing: boolean;
  editingVideo: CourseVideo | null;
  onEdit: (video: CourseVideo) => void;
  onSave: (video: CourseVideo) => void;
  onCancel: () => void;
  onDelete: (videoId: string, courseId: string) => void;
  onEditingChange: (video: CourseVideo | null) => void;
}

const VideoListItem: React.FC<VideoListItemProps> = ({
  video,
  isEditing,
  editingVideo,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditingChange
}) => {
  if (isEditing && editingVideo) {
    return (
      <div className="flex-1 space-y-1">
        <Input
          value={editingVideo.title}
          onChange={(e) => onEditingChange({...editingVideo, title: e.target.value})}
          className="text-xs h-6"
        />
        <Input
          value={editingVideo.video_url}
          onChange={(e) => onEditingChange({...editingVideo, video_url: e.target.value})}
          className="text-xs h-6"
          placeholder="Video URL"
        />
        <div className="flex space-x-1 mt-1">
          <Button size="sm" onClick={() => onSave(editingVideo)} className="h-6 px-2">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="h-6 px-2">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1">
        <span className="font-medium">{video.title}</span>
        {video.duration && <span className="text-gray-500 ml-2">({video.duration})</span>}
      </div>
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(video)}
          className="h-6 w-6 p-0"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(video.id, video.course_id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </>
  );
};

export default VideoListItem;
