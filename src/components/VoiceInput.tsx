import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { VoiceRecorder, voiceToTextService } from '@/services/voiceToTextService';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscription, 
  disabled = false, 
  className = '' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const recorderRef = useRef<VoiceRecorder | null>(null);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      recorderRef.current = new VoiceRecorder();
      await recorderRef.current.startRecording();
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      toast({
        title: "Recording Failed",
        description: error.message || "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      toast({
        title: "Processing...",
        description: "Converting speech to text",
      });

      const audioBase64 = await recorderRef.current.stopRecording();
      const transcription = await voiceToTextService.transcribeAudio(audioBase64);
      
      if (transcription.trim()) {
        onTranscription(transcription);
        toast({
          title: "Transcription Complete",
          description: "Speech converted to text successfully",
        });
      } else {
        toast({
          title: "No Speech Detected",
          description: "Please try recording again",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('Failed to process recording:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Could not convert speech to text",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      recorderRef.current = null;
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      onClick={handleToggleRecording}
      disabled={disabled || isProcessing}
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      className={`${className} ${isRecording ? 'animate-pulse' : ''}`}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4 mr-2" />
      ) : (
        <Mic className="h-4 w-4 mr-2" />
      )}
      
      {isProcessing 
        ? 'Processing...' 
        : isRecording 
          ? 'Stop Recording' 
          : 'Voice Input'
      }
    </Button>
  );
};

export default VoiceInput;