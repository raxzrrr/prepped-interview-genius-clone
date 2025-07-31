import { supabase } from '@/integrations/supabase/client';

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      console.log('Starting voice recording...');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('Voice recording started successfully');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          console.log('Processing recorded audio...');
          
          // Create blob from chunks
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          console.log('Audio blob created, size:', audioBlob.size, 'bytes');

          // Convert to base64
          const base64Audio = await this.blobToBase64(audioBlob);
          
          // Clean up
          this.cleanup();
          
          resolve(base64Audio);
        } catch (error) {
          console.error('Error processing recording:', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (data:audio/webm;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }
}

export class VoiceToTextService {
  async transcribeAudio(audioBase64: string, language = 'en'): Promise<string> {
    try {
      console.log('Sending audio for transcription...');
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: audioBase64,
          language: language
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      if (!data || !data.text) {
        throw new Error('No transcription received');
      }

      console.log('Transcription successful:', data.text);
      return data.text;
      
    } catch (error) {
      console.error('Error in transcription service:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  // Simplified method - component will handle the recording lifecycle
  async transcribeAudioBlob(audioBlob: Blob, language = 'en'): Promise<string> {
    const base64Audio = await this.blobToBase64(audioBlob);
    return this.transcribeAudio(base64Audio, language);
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const voiceToTextService = new VoiceToTextService();
export default voiceToTextService;