
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Users, Video, CreditCard, ArrowUpRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // Redirect if not logged in or not an admin
  if (!user || !isAdmin()) {
    return <Navigate to="/login" />;
  }
  
  // Mock data for charts
  const userActivityData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 800 },
    { name: 'Apr', users: 1200 },
    { name: 'May', users: 1600 },
    { name: 'Jun', users: 1800 },
    { name: 'Jul', users: 2400 },
  ];
  
  const subscriptionData = [
    { name: 'Free', value: 65 },
    { name: 'Pro', value: 30 },
    { name: 'Enterprise', value: 5 },
  ];
  
  const COLORS = ['#E5E7EB', '#7C4DFF', '#4285F4'];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of platform metrics and user activity
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,453</div>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Interview Sessions</CardTitle>
              <Video className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,876</div>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+8.2% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">864</div>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+4.6% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
              <CreditCard className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$32,845</div>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+16.3% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                Monthly user registration over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userActivityData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#7C4DFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>
                User breakdown by subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
              <CardDescription>
                New users in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-gray-500">john.doe@example.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium">AS</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Alice Smith</p>
                    <p className="text-xs text-gray-500">alice.smith@example.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium">RW</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Robert Wilson</p>
                    <p className="text-xs text-gray-500">robert.wilson@example.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium">EJ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Emily Johnson</p>
                    <p className="text-xs text-gray-500">emily.johnson@example.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Users
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Courses</CardTitle>
              <CardDescription>
                Most popular learning content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Mastering Behavioral Interviews</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>5,680 enrolled</span>
                      <span>•</span>
                      <span>4.8 rating</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-purple">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Resume Building Workshop</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>6,250 enrolled</span>
                      <span>•</span>
                      <span>4.9 rating</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-purple">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Technical Interview Fundamentals</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>4,230 enrolled</span>
                      <span>•</span>
                      <span>4.7 rating</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-purple">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Interview Anxiety Management</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>5,380 enrolled</span>
                      <span>•</span>
                      <span>4.8 rating</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-purple">4</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Courses
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                Latest subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Michael Brown</p>
                    <p className="text-sm font-medium">$19.99</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pro Subscription</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Sarah Williams</p>
                    <p className="text-sm font-medium">$49.99</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Enterprise Subscription</span>
                    <span>5 hours ago</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">David Miller</p>
                    <p className="text-sm font-medium">$19.99</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pro Subscription</span>
                    <span>8 hours ago</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Jennifer Lee</p>
                    <p className="text-sm font-medium">$19.99</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pro Subscription</span>
                    <span>10 hours ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Payments
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
