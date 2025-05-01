
import { supabase } from '@/integrations/supabase/client';

class TTSService {
  private static instance: TTSService;
  private audioCache: Map<string, string>;

  private constructor() {
    this.audioCache = new Map();
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  public async textToSpeech(text: string, voice: string = 'en-US-Neural2-F'): Promise<string> {
    // Check if we have this text cached
    const cacheKey = `${text}_${voice}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.audioContent) {
        // Cache the result
        this.audioCache.set(cacheKey, data.audioContent);
        return data.audioContent;
      } else {
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('Error in text-to-speech conversion:', error);
      throw error;
    }
  }

  public async speakText(text: string, voice: string = 'en-US-Neural2-F'): Promise<void> {
    try {
      const audioContent = await this.textToSpeech(text, voice);
      
      // Create audio element and play
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
      
      return new Promise((resolve) => {
        audio.onended = () => resolve();
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      // Fallback to browser's native TTS if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        
        return new Promise((resolve) => {
          utterance.onend = () => resolve();
        });
      }
      throw error;
    }
  }

  // Method to clear the cache
  public clearCache(): void {
    this.audioCache.clear();
  }
}

export const ttsService = TTSService.getInstance();
export default ttsService;
