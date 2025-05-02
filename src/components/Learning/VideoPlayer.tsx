
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (progress: number) => void;
  initialProgress?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onProgress, initialProgress = 0 }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialProgress);
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
  }, []);
  
  // Track video progress
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (!loading && !error) {
      // Simulate progress tracking
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // Cap progress at 100%
          const newProgress = Math.min(prevProgress + 0.5, 100);
          
          // Call the onProgress callback
          if (newProgress !== prevProgress) {
            onProgress(newProgress);
          }
          
          return newProgress;
        });
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading, error]);
  
  // Handle iframe loading
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load video. Please try again later.');
  };

  // Handle marking video as completed
  const handleMarkAsCompleted = () => {
    // Update progress to 100% and call the onProgress callback
    setProgress(100);
    onProgress(100);
    
    toast({
      title: "Module Completed",
      description: "This module has been marked as completed.",
    });
  };
  
  const isYouTubeVideo = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeoVideo = videoUrl.includes('vimeo.com');
  
  // Ensure the URL has the necessary parameters for embedding
  const getEmbedUrl = () => {
    let url = videoUrl;
    
    // Add necessary params for YouTube to disable downloading
    if (isYouTubeVideo) {
      // Ensure it's an embed URL
      if (!url.includes('embed')) {
        const videoId = url.includes('v=') 
          ? new URLSearchParams(url.split('?')[1]).get('v')
          : url.split('/').pop();
        url = `https://www.youtube.com/embed/${videoId}`;
      }
      
      // Add parameters
      url = url.includes('?') 
        ? `${url}&rel=0&modestbranding=1&enablejsapi=1` 
        : `${url}?rel=0&modestbranding=1&enablejsapi=1`;
    }
    
    // Add necessary params for Vimeo
    if (isVimeoVideo && !url.includes('player.vimeo.com')) {
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
            <button 
              className="bg-brand-purple text-white px-4 py-2 rounded-md"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        ></iframe>
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-purple rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <Button 
          onClick={handleMarkAsCompleted}
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Mark as Completed
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;
