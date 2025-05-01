
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const topics = [
  { id: 'hr', name: 'HR', description: 'Common HR and behavioral questions' },
  { id: 'java', name: 'Java', description: 'Java programming and concepts' },
  { id: 'python', name: 'Python', description: 'Python programming and concepts' },
  { id: 'javascript', name: 'JavaScript', description: 'JavaScript and web development' },
  { id: 'data_science', name: 'Data Science', description: 'Data analysis and machine learning' },
  { id: 'product_management', name: 'Product Management', description: 'Product development and management' },
  { id: 'system_design', name: 'System Design', description: 'Architecture and system design concepts' },
  { id: 'leadership', name: 'Leadership', description: 'Leadership and management skills' }
];

const CustomInterviewsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string>('hr');
  const [usageData, setUsageData] = useState<{ custom_interviews: number, resume_interviews: number }>({ 
    custom_interviews: 0, 
    resume_interviews: 0 
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserInterviewUsage();
    }
  }, [user]);

  const fetchUserInterviewUsage = async () => {
    if (!user) return;
    
    try {
      // Get the current month's first day
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: interviews, error } = await supabase
        .from('interviews')
        .select('id, title')
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString());
      
      if (error) throw error;
      
      // Count custom and resume interviews
      const custom = interviews?.filter(i => i.title.includes('Custom')).length || 0;
      const resume = interviews?.filter(i => !i.title.includes('Custom')).length || 0;
      
      setUsageData({ 
        custom_interviews: custom,
        resume_interviews: resume
      });
      
    } catch (error) {
      console.error('Error fetching user interview usage:', error);
    }
  };

  const handleStartInterview = async () => {
    if (usageData.custom_interviews >= 2) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your limit of 2 custom interviews this month.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedTopicName = topics.find(t => t.id === selectedTopic)?.name || selectedTopic;
      
      // Create a new interview record
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          user_id: user?.id,
          title: `Custom ${selectedTopicName} Interview`,
          questions: [],
          status: 'pending'
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      if (data?.id) {
        // Redirect to the interview page with the new ID
        navigate(`/interviews/${data.id}?type=custom&topic=${selectedTopic}`);
      }
      
    } catch (error: any) {
      console.error('Error starting custom interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Interviews</h1>
          <p className="mt-2 text-gray-600">
            Create specialized interviews based on your preferred topics
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Usage Limits Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-gray-500" /> 
                Monthly Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Custom Interviews</span>
                    <span className={`text-sm font-medium ${usageData.custom_interviews >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                      {usageData.custom_interviews}/2
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${usageData.custom_interviews >= 2 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${(usageData.custom_interviews / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Resume Interviews</span>
                    <span className={`text-sm font-medium ${usageData.resume_interviews >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                      {usageData.resume_interviews}/2
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${usageData.resume_interviews >= 2 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${(usageData.resume_interviews / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-start mt-4">
                  <AlertTriangle className="text-amber-500 mr-2 h-5 w-5 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Limits reset after 30 days from your first interview of the month.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic Benefits Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Topic Benefits</CardTitle>
              <CardDescription>
                Custom interviews help you prepare for specific technical skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Focus on Your Field</h4>
                    <p className="text-sm text-gray-600">
                      Practice with questions specific to your target role or technology
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Technical Preparation</h4>
                    <p className="text-sm text-gray-600">
                      Get real technical questions that cover both fundamentals and advanced topics
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">AI Voice Questions</h4>
                    <p className="text-sm text-gray-600">
                      Questions are asked verbally by our AI, creating a realistic interview experience
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Choose Interview Topic</CardTitle>
            <CardDescription>
              Select a topic for your custom interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedTopic} onValueChange={setSelectedTopic} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
                {topics.slice(0, 8).map((topic) => (
                  <TabsTrigger key={topic.id} value={topic.id}>
                    {topic.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {topics.map((topic) => (
                <TabsContent key={topic.id} value={topic.id} className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">{topic.name} Interview</h3>
                  <p className="text-gray-600 mb-4">{topic.description}</p>
                  <div>
                    <Label className="text-sm font-medium">This interview will cover:</Label>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Technical knowledge assessment
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Problem-solving skills
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Experience-based scenarios
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStartInterview}
              disabled={isLoading || usageData.custom_interviews >= 2}
              className="w-full md:w-auto"
            >
              {isLoading ? 'Starting Interview...' : 'Start Custom Interview'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomInterviewsPage;
