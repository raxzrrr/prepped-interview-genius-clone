
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Key, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface ApiKeySettingsProps {
  onComplete?: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onComplete }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [googleTTSApiKey, setGoogleTTSApiKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getSupabaseUserId, profile } = useAuth();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const userId = getSupabaseUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('gemini_api_key, google_tts_api_key')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading API keys:', error);
        return;
      }

      if (data) {
        setGeminiApiKey(data.gemini_api_key || '');
        setGoogleTTSApiKey(data.google_tts_api_key || '');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSave = async () => {
    // Validate API keys before saving
    if (geminiApiKey && !geminiApiKey.startsWith('AIza')) {
      toast({
        title: "Invalid API Key",
        description: "Gemini API key should start with 'AIza'",
        variant: "destructive"
      });
      return;
    }

    if (googleTTSApiKey && !googleTTSApiKey.startsWith('AIza')) {
      toast({
        title: "Invalid API Key", 
        description: "Google TTS API key should start with 'AIza'",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          gemini_api_key: geminiApiKey || null,
          google_tts_api_key: googleTTSApiKey || null
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved securely to the database.",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save API keys. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowApiKeys = () => {
    setShowApiKeys(!showApiKeys);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="mr-2 h-5 w-5" />
          API Configuration
        </CardTitle>
        <CardDescription>
          Configure your API keys for AI-powered interview features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            API keys are stored securely in the database and are only accessible to you.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <div className="flex">
            <Input
              id="gemini-api-key"
              type={showApiKeys ? "text" : "password"}
              placeholder="Enter your Google Gemini API key (starts with AIza...)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleShowApiKeys}
              className="ml-2"
            >
              {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Get your API key from{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-purple hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="google-tts-api-key">Google Text-to-Speech API Key</Label>
          <div className="flex">
            <Input
              id="google-tts-api-key"
              type={showApiKeys ? "text" : "password"}
              placeholder="Enter your Google Text-to-Speech API key (starts with AIza...)"
              value={googleTTSApiKey}
              onChange={(e) => setGoogleTTSApiKey(e.target.value)}
              className="flex-1"
            />
          </div>
          <p className="text-sm text-gray-500">
            Get your API key from{' '}
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-purple hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save API Keys'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySettings;
