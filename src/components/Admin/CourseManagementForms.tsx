
import React from 'react';
import { Course } from '@/services/courseService';
import AddCourseForm from '@/components/Admin/AddCourseForm';
import AddVideoForm from '@/components/Admin/AddVideoForm';

interface CourseManagementFormsProps {
  showAddCourse: boolean;
  showAddVideo: boolean;
  selectedCourse: Course | null;
  onAddCourse: (courseData: { name: string; description: string; order_index: number }) => void;
  onCancelAddCourse: () => void;
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
  onCancelAddVideo: () => void;
}

const CourseManagementForms: React.FC<CourseManagementFormsProps> = ({
  showAddCourse,
  showAddVideo,
  showAddQuestion,
  selectedCourse,
  questions,
  onAddCourse,
  onCancelAddCourse,
  onAddVideo,
  onCancelAddVideo,
  onAddQuestion,
  onCancelAddQuestion
}) => {
  return (
    <>
      {showAddCourse && (
        <AddCourseForm
          onAddCourse={onAddCourse}
          onCancel={onCancelAddCourse}
        />
      )}

      {showAddVideo && selectedCourse && (
        <AddVideoForm
          selectedCourse={selectedCourse}
          onAddVideo={onAddVideo}
          onCancel={onCancelAddVideo}
        />
      )}
    </>
  );
};

export default CourseManagementForms;
