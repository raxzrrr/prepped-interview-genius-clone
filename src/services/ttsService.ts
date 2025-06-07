
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

        if (error) {
          console.warn('Edge function TTS failed:', error);
          throw new Error('Edge function unavailable');
        }

        if (data && data.audioData) {
          const audioBlob = new Blob([Buffer.from(data.audioData, 'base64')], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          this.currentAudio = new Audio(audioUrl);
          
          return new Promise((resolve, reject) => {
            if (this.currentAudio) {
              this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
              };
              this.currentAudio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                reject(new Error('Audio playback failed'));
              };
              this.currentAudio.play().catch(reject);
            }
          });
        }
      } catch (edgeError) {
        console.warn('Edge function TTS failed, trying browser TTS:', edgeError);
      }

      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        return new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          
          utterance.onend = () => resolve();
          utterance.onerror = (event) => {
            console.error('Browser TTS error:', event);
            reject(new Error('Browser TTS failed'));
          };
          
          window.speechSynthesis.speak(utterance);
        });
      } else {
        throw new Error('TTS not supported in this browser');
      }

    } catch (error) {
      console.error('TTS Error:', error);
      this.isSupported = false;
      throw error;
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
