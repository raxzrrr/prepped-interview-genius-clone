
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, PlayCircle, ArrowLeft } from 'lucide-react';
import { CourseCategory, CourseVideo } from '@/services/courseService';

interface CategoryVideoListProps {
  category: CourseCategory;
  videos: CourseVideo[];
  onVideoSelect: (video: CourseVideo) => void;
  onMarkAsCompleted: (videoId: string, event: React.MouseEvent) => void;
  onBackToCategories: () => void;
  getVideoProgress: (videoId: string) => boolean;
}

const CategoryVideoList: React.FC<CategoryVideoListProps> = ({
  category,
  videos,
  onVideoSelect,
  onMarkAsCompleted,
  onBackToCategories,
  getVideoProgress
}) => {
  const completedCount = videos.filter(video => getVideoProgress(video.id)).length;
  const progress = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBackToCategories}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{category.name}</h2>
          <p className="text-gray-600">{category.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{category.name} Course</CardTitle>
              <p className="mt-1 text-gray-600">Complete all videos to master this topic</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-purple">{progress}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-4">
            {videos.length === 0 ? (
              <div className="text-center py-8">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No videos available</h3>
                <p className="text-gray-500">Videos for this category will be added soon.</p>
              </div>
            ) : (
              videos.map((video, index) => {
                const isCompleted = getVideoProgress(video.id);
                return (
                  <div 
                    key={video.id}
                    className={`flex items-start p-3 border rounded-lg ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 hover:border-brand-purple/50 hover:bg-brand-purple/5 cursor-pointer'
                    }`}
                  >
                    <div 
                      className="mr-4 mt-1 cursor-pointer"
                      onClick={() => onVideoSelect(video)}
                    >
                      {isCompleted ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500">
                          <Check className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onVideoSelect(video)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">
                          {index + 1}. {video.title}
                        </h4>
                        <span className="text-sm text-gray-500">{video.duration}</span>
                      </div>
                      <p className="text-sm mt-1 text-gray-600">
                        {video.description}
                      </p>
                    </div>
                    
                    <div className="ml-4 flex items-center">
                      <Button 
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                        className={`${isCompleted ? 'bg-green-50 text-green-600 border-green-200' : 'bg-brand-purple hover:bg-brand-purple/90'}`}
                        onClick={(e) => onMarkAsCompleted(video.id, e)}
                        disabled={isCompleted}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isCompleted ? 'Completed' : 'Mark Complete'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {completedCount} of {videos.length} videos completed
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CategoryVideoList;
