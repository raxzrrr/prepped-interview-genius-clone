
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
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.config, ...parsed };
        console.log('Loaded config from localStorage');
      }
    } catch (error) {
      console.error('Error loading environment variables from localStorage:', error);
    }
  }

  public saveToLocalStorage(): void {
    try {
      localStorage.setItem('env_config', JSON.stringify(this.config));
      console.log('Saved config to localStorage');
    } catch (error) {
      console.error('Error saving environment variables to localStorage:', error);
    }
  }

  public get(key: keyof EnvConfig): string | null {
    const value = this.config[key];
    console.log(`Getting ${key}:`, value ? 'Key present' : 'Key missing');
    return value;
  }

  public set(key: keyof EnvConfig, value: string | null): void {
    this.config[key] = value;
    this.saveToLocalStorage();
    console.log(`Set ${key}:`, value ? 'Key set' : 'Key cleared');
  }

  public isConfigured(key: keyof EnvConfig): boolean {
    const isConfigured = this.config[key] !== null && this.config[key] !== '';
    console.log(`${key} configured:`, isConfigured);
    return isConfigured;
  }

  public getAllConfig(): EnvConfig {
    return { ...this.config };
  }

  // Debug method to check configuration
  public debugApiKey(): void {
    console.log('=== API Key Debug ===');
    console.log('LocalStorage config:', this.config);
    console.log('Final GEMINI_API_KEY:', this.get('GEMINI_API_KEY') ? 'Present' : 'Missing');
    console.log('===================');
  }
}

export const envService = EnvService.getInstance();
export default envService;
