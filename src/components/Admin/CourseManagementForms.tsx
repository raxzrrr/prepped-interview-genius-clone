import React from 'react';
import AddCourseForm from './AddCourseForm';
import AddVideoForm from './AddVideoForm';
import AddQuestionForm from './AddQuestionForm';
import { Course } from '@/services/courseService';
import { CourseQuestion } from '@/services/questionService';

interface CourseManagementFormsProps {
  showAddCourse: boolean;
  showAddVideo: boolean;
  showAddQuestion: boolean;
  selectedCourse: Course | null;
  questions: Record<string, CourseQuestion[]>;
  onAddCourse: (courseData: { name: string; description: string; order_index: number }) => Promise<void>;
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
  }) => Promise<void>;
  onCancelAddVideo: () => void;
  onAddQuestion: (questionData: {
    question_text: string;
    difficulty_level: 'easy' | 'intermediate' | 'hard';
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_answer: number;
    explanation?: string;
    order_index: number;
  }) => Promise<void>;
  onCancelAddQuestion: () => void;
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
    <div className="space-y-6">
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

      {showAddQuestion && selectedCourse && (
        <AddQuestionForm
          onAddQuestion={onAddQuestion}
          onCancel={onCancelAddQuestion}
          nextOrderIndex={(questions[selectedCourse.id] || []).length}
        />
      )}
    </div>
  );
};

export default CourseManagementForms;