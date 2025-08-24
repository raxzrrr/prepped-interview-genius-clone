import React, { useEffect, useRef, useState } from 'react';
import { Minus, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveCameraPreviewProps {
  onClose?: () => void;
}

const LiveCameraPreview: React.FC<LiveCameraPreviewProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false // Only video, no audio for privacy
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setPermissionDenied(true);
      }
    };

    if (isVisible) {
      initializeCamera();
    }

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVisible]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsVisible(false);
    onClose?.();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  if (permissionDenied) {
    return (
      <div className="fixed top-4 right-4 z-[9999] bg-background border border-border rounded-xl p-4 shadow-lg max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Camera Access</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Camera permission denied. Please allow camera access to see yourself during practice.
        </p>
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={() => window.location.reload()}
        >
          Retry Camera Access
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-in-out ${
        isMinimized 
          ? 'w-12 h-12' 
          : 'w-[150px] h-[150px]'
      }`}
    >
      {isMinimized ? (
        // Minimized state - small circular bubble
        <div
          className="w-12 h-12 bg-background border border-border rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200 flex items-center justify-center group"
          onClick={toggleMinimize}
        >
          <Video className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          {/* Close button for minimized state */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-background hover:bg-destructive hover:text-destructive-foreground border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      ) : (
        // Full size state
        <div className="relative w-full h-full bg-background border border-border rounded-xl shadow-lg overflow-hidden group">
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie
          />
          
          {/* Control overlay */}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Minimize button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-background/80 hover:bg-background backdrop-blur-sm"
              onClick={toggleMinimize}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCameraPreview;