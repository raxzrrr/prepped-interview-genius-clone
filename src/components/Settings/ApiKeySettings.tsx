
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Key, Eye, EyeOff, Save } from 'lucide-react';
import envService from '@/services/env';

interface ApiKeySettingsProps {
  onComplete?: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onComplete }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = envService.get('GEMINI_API_KEY');
    if (storedKey) {
      setGeminiApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    envService.set('GEMINI_API_KEY', geminiApiKey);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved successfully.",
    });
    
    if (onComplete) {
      onComplete();
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
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
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <div className="flex">
            <Input
              id="gemini-api-key"
              type={showApiKey ? "text" : "password"}
              placeholder="Enter your Google Gemini API key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleShowApiKey}
              className="ml-2"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save API Keys
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySettings;
