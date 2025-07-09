
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Play } from 'lucide-react';
import { Course } from '@/services/courseService';

interface CategoryCardProps {
  category: Course;
  progress?: number;
  videoCount?: number;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  progress = 0,
  videoCount = 0,
  onClick
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress || 0, 0), 100);
  
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:scale-105 cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-purple/10 group-hover:bg-brand-purple/20 transition-colors">
            <BookOpen className="h-5 w-5 text-brand-purple" />
          </div>
          <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {category.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{videoCount} {videoCount === 1 ? 'video' : 'videos'}</span>
            <span>{Math.round(clampedProgress)}% Complete</span>
          </div>
          
          {clampedProgress > 0 && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-purple rounded-full transition-all duration-300"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
        >
          <Play className="h-4 w-4 mr-2" />
          {clampedProgress === 0 ? 'Start Learning' : clampedProgress >= 100 ? 'Review' : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CategoryCard;
