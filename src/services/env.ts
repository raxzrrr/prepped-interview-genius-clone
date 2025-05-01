
interface EnvConfig {
  GEMINI_API_KEY: string | null;
  GOOGLE_TTS_API_KEY: string | null;
}

class EnvService {
  private static instance: EnvService;
  private config: EnvConfig = {
    GEMINI_API_KEY: null,
    GOOGLE_TTS_API_KEY: null
  };

  private constructor() {
    this.loadFromLocalStorage();
    // Get from environment if available
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      this.config.GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    }
  }

  public static getInstance(): EnvService {
    if (!EnvService.instance) {
      EnvService.instance = new EnvService();
    }
    return EnvService.instance;
  }

  private loadFromLocalStorage(): void {
    try {
      const storedConfig = localStorage.getItem('env_config');
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Error loading environment variables from localStorage:', error);
    }
  }

  public saveToLocalStorage(): void {
    try {
      localStorage.setItem('env_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving environment variables to localStorage:', error);
    }
  }

  public get(key: keyof EnvConfig): string | null {
    return this.config[key];
  }

  public set(key: keyof EnvConfig, value: string | null): void {
    this.config[key] = value;
    this.saveToLocalStorage();
  }

  public isConfigured(key: keyof EnvConfig): boolean {
    return this.config[key] !== null && this.config[key] !== '';
  }

  public getAllConfig(): EnvConfig {
    return { ...this.config };
  }
}

export const envService = EnvService.getInstance();
export default envService;
