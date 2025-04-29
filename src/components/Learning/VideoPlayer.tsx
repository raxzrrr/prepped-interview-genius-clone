
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  description,
  videoUrl,
  thumbnail
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: !isPlaying ? "Video Started" : "Video Paused",
      description: !isPlaying ? "The video is now playing." : "The video has been paused.",
    });
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg aspect-video bg-gray-900">
          {/* Video Thumbnail with Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={thumbnail}
              alt={title}
              className="object-cover w-full h-full"
            />
            
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 text-white rounded-full bg-brand-purple bg-opacity-70 hover:bg-opacity-100 transition-colors"
                  onClick={togglePlay}
                >
                  <Play className="w-8 h-8" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1 mt-2 overflow-hidden bg-white/30 rounded-full">
              <div
                className="h-full bg-brand-purple"
                style={{ width: isPlaying ? '35%' : '0%', transition: 'width 0.3s ease' }}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          {isPlaying ? '03:15 / 09:27' : '00:00 / 09:27'}
        </div>
        <div className="text-sm font-medium text-brand-purple">
          HD
        </div>
      </CardFooter>
    </Card>
  );
};

export default VideoPlayer;
