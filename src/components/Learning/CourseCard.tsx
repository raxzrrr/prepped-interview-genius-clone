
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star } from 'lucide-react';

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
  progress
}) => {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="object-cover w-full h-48"
        />
        {isPremium && (
          <Badge className="absolute top-2 right-2 bg-brand-purple">
            Premium
          </Badge>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-brand-purple"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 mr-1 fill-current" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{enrolledCount.toLocaleString()} enrolled</span>
          </div>
        </div>
        
        {progress !== undefined && progress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-medium text-gray-700">{progress}%</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={isPremium ? "default" : "outline"}
          onClick={() => navigate(`/learning/${id}`)}
        >
          {progress !== undefined && progress > 0 ? 'Continue Learning' : 'Start Learning'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
