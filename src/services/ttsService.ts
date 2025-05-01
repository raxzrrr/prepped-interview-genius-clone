
import { supabase } from "@/integrations/supabase/client";
import envService from "./env";

interface TTSOptions {
  voice?: string;
  language?: string;
  pitch?: number;
  speakingRate?: number;
}

class TTSService {
  private static instance: TTSService;
  private audioContext: AudioContext | null = null;
  private audio: HTMLAudioElement | null = null;
  
  private constructor() {}
  
  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }
  
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text,
          voice: options.voice || 'en-US-Neural2-F'
        }
      });
      
      if (error) {
        throw new Error(`TTS API Error: ${error.message}`);
      }
      
      if (data?.audioContent) {
        await this.playAudio(data.audioContent);
        return;
      }
      
      throw new Error('No audio content received');
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to browser's TTS if available
      this.speakWithBrowserTTS(text, options);
    }
  }
  
  private async playAudio(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }
      
      // Create a new audio element
      this.audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      
      // Set up event handlers
      this.audio.onended = () => resolve();
      this.audio.onerror = (e) => reject(e);
      
      // Play the audio
      this.audio.play().catch(reject);
    });
  }
  
  private speakWithBrowserTTS(text: string, options: TTSOptions = {}): void {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language if specified
      if (options.language) {
        utterance.lang = options.language;
      }
      
      // Set voice if specified and available
      if (options.voice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      // Set pitch and rate if specified
      if (options.pitch !== undefined) {
        utterance.pitch = options.pitch;
      }
      
      if (options.speakingRate !== undefined) {
        utterance.rate = options.speakingRate;
      }
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Browser TTS not available');
    }
  }
  
  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const ttsService = TTSService.getInstance();
export default ttsService;
