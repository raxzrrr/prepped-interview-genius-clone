
import React from 'react';
import { Grid3X3, Loader2 } from 'lucide-react';
import CategoryCard from './CategoryCard';
import { Course } from '@/services/courseService';

interface CourseCategoryGridProps {
  categories: Course[];
  loading: boolean;
  onCategorySelect: (category: Course) => void;
  getCategoryProgress: (categoryId: string) => number;
  getCategoryVideoCount: (categoryId: string) => number;
}

const CourseCategoryGrid: React.FC<CourseCategoryGridProps> = ({
  categories,
  loading,
  onCategorySelect,
  getCategoryProgress,
  getCategoryVideoCount
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading courses...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your learning content</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
        <div className="bg-gradient-to-br from-gray-400 to-gray-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Grid3X3 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">No courses available</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Check back later for new course content, or contact your administrator to add courses.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          progress={getCategoryProgress(category.id)}
          videoCount={getCategoryVideoCount(category.id)}
          onClick={() => onCategorySelect(category)}
        />
      ))}
    </div>
  );
};

export default CourseCategoryGrid;
