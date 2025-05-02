
import { supabase } from "@/integrations/supabase/client";

interface TTSOptions {
  voice?: string;
}

class TTSService {
  private audio: HTMLAudioElement | null = null;
  
  constructor() {
    this.audio = null;
  }
  
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!text) return;
    
    // Stop any current speech
    this.stop();
    
    try {
      // Call the Supabase edge function for Text-to-Speech
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text,
          voice: options.voice || 'en-US-Neural2-F' // Default voice
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data || !data.audioContent) throw new Error('No audio content received');
      
      // Create a new Audio element with the base64 audio content
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      this.audio = new Audio(audioSrc);
      
      // Return a promise that resolves when audio finishes playing
      return new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error('Audio element not created'));
        
        this.audio.onended = () => {
          resolve();
        };
        
        this.audio.onerror = (e) => {
          reject(new Error('Error playing audio: ' + e));
        };
        
        this.audio.play().catch(reject);
      });
      
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }
  
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
  
  isPlaying(): boolean {
    return !!this.audio && !this.audio.paused;
  }
}

const ttsService = new TTSService();
export default ttsService;
