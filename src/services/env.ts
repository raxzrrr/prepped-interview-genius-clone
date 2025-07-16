// This service is now deprecated - API keys are stored in the database
// Keeping this file for backward compatibility but functionality is moved to database

interface EnvConfig {
  GEMINI_API_KEY: string | null;
  GOOGLE_TTS_API_KEY: string | null;
}

class EnvService {
  private static instance: EnvService;

  private constructor() {
    console.log('EnvService: API keys are now stored in the database. Please use the Settings page to manage your API keys.');
  }

  public static getInstance(): EnvService {
    if (!EnvService.instance) {
      EnvService.instance = new EnvService();
    }
    return EnvService.instance;
  }

  public get(key: keyof EnvConfig): string | null {
    console.log(`EnvService.get(${key}): API keys are now stored in the database`);
    return null;
  }

  public set(key: keyof EnvConfig, value: string | null): void {
    console.log(`EnvService.set(${key}): API keys are now stored in the database. Use Settings page to update.`);
  }

  public isConfigured(key: keyof EnvConfig): boolean {
    console.log(`EnvService.isConfigured(${key}): Check database instead`);
    return false;
  }

  public getAllConfig(): EnvConfig {
    return {
      GEMINI_API_KEY: null,
      GOOGLE_TTS_API_KEY: null
    };
  }

  public debugApiKey(): void {
    console.log('=== API Key Debug ===');
    console.log('API keys are now stored in the database');
    console.log('Use the Settings page to manage your API keys');
    console.log('===================');
  }
}

export const envService = EnvService.getInstance();
export default envService;
