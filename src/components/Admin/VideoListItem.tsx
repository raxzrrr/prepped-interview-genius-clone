
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Save, X, Link, Upload, Play } from 'lucide-react';
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
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

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
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{video.title}</span>
          <Badge 
            variant={video.content_type === 'file' ? 'default' : 'secondary'}
            className="text-xs px-1 py-0"
          >
            {video.content_type === 'file' ? (
              <><Upload className="w-3 h-3 mr-1" />File</>
            ) : (
              <><Link className="w-3 h-3 mr-1" />URL</>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {video.duration && (
            <span className="flex items-center">
              <Play className="w-3 h-3 mr-1" />
              {video.duration}
            </span>
          )}
          {video.content_type === 'file' && video.file_size && (
            <span>{formatFileSize(video.file_size)}</span>
          )}
        </div>

        {video.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
        )}
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
