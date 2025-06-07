
import React from 'react';
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
import ApiKeySettings from '@/components/Settings/ApiKeySettings';
import { User, Key, Bell, Shield, CreditCard } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center">
              <Key className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">API Keys</span>
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
                  <Input id="name" defaultValue={user?.user_metadata?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email || ''} disabled />
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Choose a username" />
                </div>
                <Button className="mt-4">Save Profile</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="mt-4">Change Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api">
            <ApiKeySettings />
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
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription plan and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg border mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Current Plan</span>
                    <span className="text-brand-purple font-medium">Premium</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Your plan renews on May 15, 2023
                  </p>
                  <div className="flex space-x-4">
                    <Button variant="outline" size="sm">Change Plan</Button>
                    <Button variant="outline" size="sm">Cancel Subscription</Button>
                  </div>
                </div>
                
                <h3 className="font-medium text-lg mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-12 h-8 bg-gray-200 rounded mr-4"></div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/24</p>
                      </div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>
                  
                  <Button variant="outline">Add Payment Method</Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-4">Billing History</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-4 bg-gray-50 p-3 font-medium">
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Invoice</div>
                    </div>
                    <div className="grid grid-cols-4 p-3 border-t">
                      <div>Apr 1, 2023</div>
                      <div>$19.99</div>
                      <div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </div>
                      <div>
                        <Button variant="link" className="p-0 h-auto">Download</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 p-3 border-t">
                      <div>Mar 1, 2023</div>
                      <div>$19.99</div>
                      <div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </div>
                      <div>
                        <Button variant="link" className="p-0 h-auto">Download</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 p-3 border-t">
                      <div>Feb 1, 2023</div>
                      <div>$19.99</div>
                      <div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </div>
                      <div>
                        <Button variant="link" className="p-0 h-auto">Download</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
