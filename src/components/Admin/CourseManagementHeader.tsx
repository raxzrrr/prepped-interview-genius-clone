
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CourseManagementHeaderProps {
  onAddCourse: () => void;
}

const CourseManagementHeader: React.FC<CourseManagementHeaderProps> = ({ onAddCourse }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
        <p className="mt-2 text-gray-600">
          Create and manage educational courses and video content (Upload files or add links)
        </p>
      </div>
      <Button onClick={onAddCourse}>
        <Plus className="w-4 h-4 mr-2" />
        Add Course
      </Button>
    </div>
  );
};

export default CourseManagementHeader;
