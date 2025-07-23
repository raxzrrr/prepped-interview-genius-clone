import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, TestTube, Save } from 'lucide-react';

interface APIKeys {
  gemini_api_key: string | null;
  google_tts_api_key: string | null;
  clerk_publishable_key: string | null;
}

const APIKeySettings: React.FC = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    gemini_api_key: '',
    google_tts_api_key: '',
    clerk_publishable_key: ''
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    tts: false,
    clerk: false
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState({
    gemini: false,
    tts: false,
    clerk: false
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase.rpc('get_api_keys');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setApiKeys(data[0]);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
    }
  };

  const handleKeyChange = (keyType: keyof APIKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyType]: value
    }));
  };

  const testAPIKey = async (keyType: 'gemini' | 'tts' | 'clerk') => {
    setTesting(prev => ({ ...prev, [keyType]: true }));
    
    try {
      let testResult = false;
      
      switch (keyType) {
        case 'gemini':
          if (apiKeys.gemini_api_key) {
            // Test Gemini API key by making a simple request
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeys.gemini_api_key}`);
            testResult = response.ok;
          }
          break;
        case 'tts':
          if (apiKeys.google_tts_api_key) {
            // Test Google TTS API key
            const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKeys.google_tts_api_key}`);
            testResult = response.ok;
          }
          break;
        case 'clerk':
          if (apiKeys.clerk_publishable_key) {
            // Basic validation for Clerk publishable key format
            testResult = apiKeys.clerk_publishable_key.startsWith('pk_');
          }
          break;
      }
      
      toast({
        title: testResult ? "Success" : "Failed",
        description: testResult ? `${keyType.toUpperCase()} API key is valid` : `${keyType.toUpperCase()} API key is invalid`,
        variant: testResult ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `Error testing ${keyType.toUpperCase()} API key`,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [keyType]: false }));
    }
  };

  const saveAPIKeys = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.rpc('update_api_keys', {
        p_gemini_key: apiKeys.gemini_api_key || null,
        p_tts_key: apiKeys.google_tts_api_key || null,
        p_clerk_key: apiKeys.clerk_publishable_key || null
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API keys updated successfully",
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (keyType: 'gemini' | 'tts' | 'clerk') => {
    setShowKeys(prev => ({
      ...prev,
      [keyType]: !prev[keyType]
    }));
  };

  const renderKeyInput = (
    keyType: keyof APIKeys,
    label: string,
    description: string,
    showKey: boolean,
    testKey: 'gemini' | 'tts' | 'clerk'
  ) => (
    <div className="space-y-3">
      <div>
        <Label htmlFor={keyType}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={keyType}
            type={showKey ? "text" : "password"}
            value={apiKeys[keyType] || ''}
            onChange={(e) => handleKeyChange(keyType, e.target.value)}
            placeholder={`Enter your ${label.toLowerCase()}`}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => toggleShowKey(testKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => testAPIKey(testKey)}
          disabled={!apiKeys[keyType] || testing[testKey]}
          className="flex items-center gap-1"
        >
          <TestTube className="h-4 w-4" />
          {testing[testKey] ? 'Testing...' : 'Test'}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
        <CardDescription>
          Manage API keys for external services. These keys are securely stored and used by the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderKeyInput(
          'gemini_api_key',
          'Gemini API Key',
          'Used for AI-powered interview question generation and analysis',
          showKeys.gemini,
          'gemini'
        )}
        
        {renderKeyInput(
          'google_tts_api_key',
          'Google Text-to-Speech API Key',
          'Used for converting text to speech in interview scenarios',
          showKeys.tts,
          'tts'
        )}
        
        {renderKeyInput(
          'clerk_publishable_key',
          'Clerk Publishable Key',
          'Used for user authentication (frontend)',
          showKeys.clerk,
          'clerk'
        )}
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={saveAPIKeys} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save All Keys'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIKeySettings;