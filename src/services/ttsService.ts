
import { supabase } from "@/integrations/supabase/client";

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private isSupported: boolean = true;

  async speak(text: string): Promise<void> {
    try {
      // Stop any current speech
      this.stop();

      console.log('Attempting TTS for text:', text.substring(0, 50) + '...');

      // Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text, voice: 'alloy', speed: 1.0 }
        });

        if (!error && data && data.audioContent) {
          // Convert base64 to blob and play
          const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mpeg');
          const audioUrl = URL.createObjectURL(audioBlob);
          
          this.currentAudio = new Audio(audioUrl);
          
          return new Promise((resolve, reject) => {
            if (this.currentAudio) {
              this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
              };
              this.currentAudio.onerror = (e) => {
                console.error('Audio playback error:', e);
                URL.revokeObjectURL(audioUrl);
                // Don't reject, fall back to browser TTS
                this.fallbackToBrowserTTS(text).then(resolve).catch(reject);
              };
              this.currentAudio.play().catch((playError) => {
                console.warn('Audio play failed, falling back to browser TTS:', playError);
                URL.revokeObjectURL(audioUrl);
                this.fallbackToBrowserTTS(text).then(resolve).catch(reject);
              });
            }
          });
        }
      } catch (edgeError) {
        console.warn('Edge function TTS failed, trying browser TTS:', edgeError);
      }

      // Fallback to browser TTS
      return this.fallbackToBrowserTTS(text);

    } catch (error) {
      console.error('TTS Error:', error);
      this.isSupported = false;
      // Don't throw error, just log it so the app continues working
      console.warn('TTS not available, continuing without audio');
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private fallbackToBrowserTTS(text: string): Promise<void> {
    if ('speechSynthesis' in window) {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
          console.error('Browser TTS error:', event);
          // Don't reject, just resolve to continue
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      });
    } else {
      console.warn('Browser TTS not supported');
      return Promise.resolve();
    }
  }

  stop(): void {
    try {
      // Stop edge function audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }

      // Stop browser TTS
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  }

  isAvailable(): boolean {
    return this.isSupported && ('speechSynthesis' in window);
  }
}

const ttsService = new TTSService();
export default ttsService;
