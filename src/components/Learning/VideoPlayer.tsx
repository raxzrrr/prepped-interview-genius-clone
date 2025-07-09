
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  contentType?: string;
  onProgress: (progress: number) => void;
  initialProgress?: number;
  moduleId: string;
  onCompleted: (moduleId: string) => void;
  onAdvanceToNext?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  contentType = 'url',
  onProgress, 
  initialProgress = 0,
  moduleId,
  onCompleted,
  onAdvanceToNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialProgress);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { toast } = useToast();
  
  // Prevent right-clicking on the video for download
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: "Download Restricted",
        description: "Video downloading is not permitted for this content.",
        variant: "destructive",
      });
      return false;
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [toast]);

  // Handle direct video file playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || contentType !== 'file') return;

    const handleLoadedMetadata = () => {
      setLoading(false);
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(video.currentTime);
        onProgress(progressPercent);

        // Mark as completed when 90% watched
        if (progressPercent >= 90 && progress < 90) {
          onCompleted(moduleId);
          
          if (onAdvanceToNext) {
            setTimeout(() => {
              onAdvanceToNext();
            }, 1500);
          }
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setLoading(false);
      setError('Failed to load video. Please try again later.');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [contentType, onProgress, onCompleted, moduleId, onAdvanceToNext, progress]);

  // Handle iframe-based video progress (for URLs like YouTube)
  useEffect(() => {
    if (contentType !== 'url') return;

    let progressInterval: NodeJS.Timeout;
    
    if (!loading && !error) {
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = Math.min(prevProgress + 5, 100);
          
          if (newProgress !== prevProgress) {
            onProgress(newProgress);
          }
          
          if (newProgress === 100 && prevProgress !== 100) {
            onCompleted(moduleId);
            
            if (onAdvanceToNext) {
              setTimeout(() => {
                onAdvanceToNext();
              }, 1500);
            }
          }
          
          return newProgress;
        });
      }, 3000);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading, error, contentType, onProgress, onCompleted, moduleId, onAdvanceToNext]);
  
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load video. Please try again later.');
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMarkAsCompleted = () => {
    setProgress(100);
    onProgress(100);
    onCompleted(moduleId);
    
    toast({
      title: "Module Completed",
      description: "This module has been marked as completed.",
    });
    
    if (onAdvanceToNext) {
      setTimeout(() => {
        onAdvanceToNext();
      }, 1500);
    }
  };
  
  const getEmbedUrl = () => {
    let url = videoUrl;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (!url.includes('embed')) {
        const videoId = url.includes('v=') 
          ? new URLSearchParams(url.split('?')[1]).get('v')
          : url.split('/').pop();
        url = `https://www.youtube.com/embed/${videoId}`;
      }
      
      url = url.includes('?') 
        ? `${url}&rel=0&modestbranding=1&enablejsapi=1` 
        : `${url}?rel=0&modestbranding=1&enablejsapi=1`;
    }
    
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const videoId = url.split('/').pop();
      url = `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="destructive" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
      
      <div className="aspect-video w-full overflow-hidden rounded-md relative">
        {contentType === 'file' ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              onContextMenu={(e) => e.preventDefault()}
              controlsList="nodownload"
            />
            
            {/* Custom video controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center space-x-4 text-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div 
                  className="flex-1 h-2 bg-white/30 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-brand-purple rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          ></iframe>
        )}
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-purple rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleMarkAsCompleted}
            className="bg-brand-purple hover:bg-brand-purple/90 font-medium"
            disabled={progress === 100}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {progress === 100 ? "Completed" : "Mark as Completed"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
