import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Download, Eye, Loader2 } from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

interface InterviewSession {
  id: string;
  date: string;
  title: string;
  duration: number | null;
  questions: string[];
  score: number | null;
  status: 'completed' | 'in-progress';
}

const InterviewsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const { getInterviews } = useInterviewApi();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const data = await getInterviews();
        
        if (data) {
          const formattedData = data.map((interview: any) => ({
            id: interview.id,
            date: interview.created_at,
            title: interview.title,
            duration: interview.duration,
            questions: interview.questions || [],
            score: interview.score,
            status: interview.status
          }));
          
          setInterviewSessions(formattedData);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviews();
  }, [user?.id]);
  
  const startNewInterview = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Interviews</h1>
            <p className="mt-2 text-gray-600">
              Review your past interviews and start new practice sessions
            </p>
          </div>
          <Button onClick={startNewInterview}>
            <Play className="w-4 h-4 mr-2" />
            Start New Interview
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Interview Sessions</CardTitle>
            <CardDescription>
              Your recent interview practice sessions and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
              </div>
            ) : interviewSessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Interview Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviewSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDistanceToNow(new Date(session.date), { addSuffix: true })}</TableCell>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>{session.duration ? `${session.duration} min` : '—'}</TableCell>
                      <TableCell>{session.questions.length}</TableCell>
                      <TableCell>
                        {session.status === 'completed' && session.score ? (
                          <span className={`font-medium ${
                            session.score >= 90 ? 'text-green-600' : 
                            session.score >= 70 ? 'text-brand-purple' : 
                            'text-amber-600'
                          }`}>
                            {session.score}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {session.status === 'completed' ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {session.status === 'completed' && (
                            <Button variant="outline" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {session.status === 'in-progress' && (
                            <Button variant="outline" size="icon">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No interview sessions found. Start a new interview to see results here.</p>
                <Button className="mt-4" onClick={startNewInterview}>Start Your First Interview</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InterviewsPage;
