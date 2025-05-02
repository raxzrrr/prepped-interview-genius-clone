
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  enrolledCount: number;
  rating: number;
  category: string;
  isPremium: boolean;
  progress?: number;
  onClick?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  thumbnail,
  duration,
  enrolledCount,
  rating,
  category,
  isPremium,
  progress = 0,
  onClick
}) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-40 object-cover"
        />
        <Badge
          className={`absolute top-2 right-2 ${
            isPremium ? 'bg-amber-400 text-black' : 'bg-green-500'
          }`}
        >
          {isPremium ? 'Premium' : 'Free'}
        </Badge>
      </div>
      <CardContent className="pt-4 flex-grow">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="font-medium mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{enrolledCount.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress >= 90 ? 'Completed' : 'In Progress'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  progress >= 90 ? 'bg-green-500' : 'bg-brand-purple'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onClick}
        >
          {progress === 0 ? 'Start Course' : progress >= 90 ? 'Review Course' : 'Continue Course'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
