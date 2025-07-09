
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Video } from 'lucide-react';
import { Course, CourseVideo } from '@/services/courseService';
import CourseCard from '@/components/Admin/CourseCard';

interface CourseManagementContentProps {
  courses: Course[];
  videos: Record<string, CourseVideo[]>;
  editingCourse: Course | null;
  editingVideo: CourseVideo | null;
  onEditCourse: (course: Course | null) => void;
  onSaveCourse: (course: Course) => void;
  onCancelEditCourse: () => void;
  onEditVideo: (video: CourseVideo | null) => void;
  onSaveVideo: (video: CourseVideo) => void;
  onCancelEditVideo: () => void;
  onDeleteCourse: (courseId: string) => void;
  onDeleteVideo: (videoId: string, courseId: string) => void;
  onAddVideo: (course: Course) => void;
  onShowAddCourse: () => void;
}

const CourseManagementContent: React.FC<CourseManagementContentProps> = ({
  courses,
  videos,
  editingCourse,
  editingVideo,
  onEditCourse,
  onSaveCourse,
  onCancelEditCourse,
  onEditVideo,
  onSaveVideo,
  onCancelEditVideo,
  onDeleteCourse,
  onDeleteVideo,
  onAddVideo,
  onShowAddCourse
}) => {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Courses Yet</h3>
          <p className="text-gray-500 mb-4">Create your first course to get started with content management.</p>
          <Button onClick={onShowAddCourse}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Course
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          videos={videos[course.id] || []}
          isEditing={editingCourse?.id === course.id}
          editingCourse={editingCourse}
          editingVideo={editingVideo}
          onEditCourse={onEditCourse}
          onSaveCourse={onSaveCourse}
          onCancelEditCourse={onCancelEditCourse}
          onEditVideo={onEditVideo}
          onSaveVideo={onSaveVideo}
          onCancelEditVideo={onCancelEditVideo}
          onDeleteCourse={onDeleteCourse}
          onDeleteVideo={onDeleteVideo}
          onAddVideo={onAddVideo}
          onEditingCourseChange={onEditCourse}
          onEditingVideoChange={onEditVideo}
        />
      ))}
    </div>
  );
};

export default CourseManagementContent;
