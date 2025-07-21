import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import BillingSection from '@/components/Settings/BillingSection';
import { User, Key, Bell, Shield, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage: React.FC = () => {
  const { user, isStudent, profile, getSupabaseUserId } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled />
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>
                <Button onClick={handleSaveProfile} className="mt-4" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-brand-purple relative">
                    <span className="absolute inset-y-0 right-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Interview Reminders</p>
                    <p className="text-sm text-gray-500">Get reminders about scheduled interviews</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-brand-purple relative">
                    <span className="absolute inset-y-0 right-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Progress Reports</p>
                    <p className="text-sm text-gray-500">Receive weekly summaries of your progress</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-gray-300 relative">
                    <span className="absolute inset-y-0 left-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Features</p>
                    <p className="text-sm text-gray-500">Learn about new platform features</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-brand-purple relative">
                    <span className="absolute inset-y-0 right-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <Button className="mt-4">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control how your information is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Collection</p>
                    <p className="text-sm text-gray-500">Allow us to collect usage data to improve your experience</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-brand-purple relative">
                    <span className="absolute inset-y-0 right-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Make your profile visible to potential employers</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-gray-300 relative">
                    <span className="absolute inset-y-0 left-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Interview Recording Storage</p>
                    <p className="text-sm text-gray-500">Allow us to store your interview recordings for analysis</p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-brand-purple relative">
                    <span className="absolute inset-y-0 right-0.5 flex items-center">
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <Button className="mt-4">Save Privacy Settings</Button>
                
                <div className="pt-6 border-t mt-6">
                  <h3 className="font-medium text-lg mb-2">Data Export & Deletion</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You can export all your data or request account deletion at any time.
                  </p>
                  <div className="flex space-x-4">
                    <Button variant="outline">Export All Data</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
