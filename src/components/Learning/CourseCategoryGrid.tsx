
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        <span className="ml-2 text-gray-600">Loading courses...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No courses available</h3>
        <p className="text-gray-500">Check back later for new course content.</p>
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
