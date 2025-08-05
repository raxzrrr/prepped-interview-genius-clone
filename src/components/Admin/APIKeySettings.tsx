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
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  pro_plan_price_inr: number | null;
  company_name: string | null;
}

const APIKeySettings: React.FC = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    gemini_api_key: '',
    google_tts_api_key: '',
    clerk_publishable_key: '',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    pro_plan_price_inr: 999,
    company_name: 'cyrobox solutions'
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    tts: false,
    clerk: false,
    razorpay_id: false,
    razorpay_secret: false
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState({
    gemini: false,
    tts: false,
    clerk: false,
    razorpay: false
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase.rpc('get_api_keys');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const apiData = data[0] as any;
        setApiKeys({
          gemini_api_key: apiData.gemini_api_key || '',
          google_tts_api_key: apiData.google_tts_api_key || '',
          clerk_publishable_key: apiData.clerk_publishable_key || '',
          razorpay_key_id: apiData.razorpay_key_id || '',
          razorpay_key_secret: apiData.razorpay_key_secret || '',
          pro_plan_price_inr: apiData.pro_plan_price_inr || 999,
          company_name: apiData.company_name || 'cyrobox solutions'
        });
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

  const handleKeyChange = (keyType: keyof APIKeys, value: string | number) => {
    setApiKeys(prev => ({
      ...prev,
      [keyType]: value
    }));
  };

  const testAPIKey = async (keyType: 'gemini' | 'tts' | 'clerk' | 'razorpay') => {
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
        case 'razorpay':
          if (apiKeys.razorpay_key_id && apiKeys.razorpay_key_secret) {
            // Basic validation for Razorpay key format
            testResult = apiKeys.razorpay_key_id.startsWith('rzp_');
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
        p_clerk_key: apiKeys.clerk_publishable_key || null,
        p_razorpay_key_id: apiKeys.razorpay_key_id || null,
        p_razorpay_key_secret: apiKeys.razorpay_key_secret || null,
        p_pro_plan_price_inr: apiKeys.pro_plan_price_inr || null
      } as any);
      
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

  const toggleShowKey = (keyType: 'gemini' | 'tts' | 'clerk' | 'razorpay_id' | 'razorpay_secret') => {
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
    testKey: 'gemini' | 'tts' | 'clerk' | 'razorpay',
    toggleKey: 'gemini' | 'tts' | 'clerk' | 'razorpay_id' | 'razorpay_secret'
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
            onClick={() => toggleShowKey(toggleKey)}
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
          'gemini',
          'gemini'
        )}
        
        {renderKeyInput(
          'google_tts_api_key',
          'Google Text-to-Speech API Key',
          'Used for converting text to speech in interview scenarios',
          showKeys.tts,
          'tts',
          'tts'
        )}
        
        {renderKeyInput(
          'clerk_publishable_key',
          'Clerk Publishable Key',
          'Used for user authentication (frontend)',
          showKeys.clerk,
          'clerk',
          'clerk'
        )}
        
        {renderKeyInput(
          'razorpay_key_id',
          'Razorpay Key ID',
          'Used for payment processing (public key)',
          showKeys.razorpay_id,
          'razorpay',
          'razorpay_id'
        )}
        
        {renderKeyInput(
          'razorpay_key_secret',
          'Razorpay Key Secret',
          'Used for payment processing (secret key)',
          showKeys.razorpay_secret,
          'razorpay',
          'razorpay_secret'
        )}
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <p className="text-sm text-muted-foreground">Company name displayed on certificates</p>
          </div>
          <Input
            id="company_name"
            type="text"
            value={apiKeys.company_name || ''}
            onChange={(e) => handleKeyChange('company_name', e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="pro_plan_price_inr">Pro Plan Price (INR)</Label>
            <p className="text-sm text-muted-foreground">Set the price for pro subscriptions in Indian Rupees</p>
          </div>
          <Input
            id="pro_plan_price_inr"
            type="number"
            value={apiKeys.pro_plan_price_inr || ''}
            onChange={(e) => handleKeyChange('pro_plan_price_inr', parseInt(e.target.value) || 999)}
            placeholder="Enter price in INR"
            min="1"
            step="1"
          />
        </div>
        
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