
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, Download, Eye } from 'lucide-react';

interface InterviewSession {
  id: string;
  date: string;
  title: string;
  duration: string;
  questions: number;
  score: number;
  status: 'completed' | 'in-progress';
}

const InterviewsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  const interviewSessions: InterviewSession[] = [
    {
      id: '1',
      date: '2023-04-28',
      title: 'Software Engineer Interview Prep',
      duration: '32 min',
      questions: 15,
      score: 85,
      status: 'completed'
    },
    {
      id: '2',
      date: '2023-04-20',
      title: 'Product Manager Mock Interview',
      duration: '45 min',
      questions: 12,
      score: 78,
      status: 'completed'
    },
    {
      id: '3',
      date: '2023-04-15',
      title: 'Frontend Developer Technical Interview',
      duration: '28 min',
      questions: 10,
      score: 92,
      status: 'completed'
    },
    {
      id: '4',
      date: '2023-04-05',
      title: 'Data Scientist Interview Practice',
      duration: '5 min',
      questions: 8,
      score: 0,
      status: 'in-progress'
    }
  ];
  
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
                    <TableCell>{session.date}</TableCell>
                    <TableCell className="font-medium">{session.title}</TableCell>
                    <TableCell>{session.duration}</TableCell>
                    <TableCell>{session.questions}</TableCell>
                    <TableCell>
                      {session.status === 'completed' ? (
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
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Average Score</span>
                  <span className="text-lg font-bold text-brand-purple">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Interviews</span>
                  <span className="text-lg font-bold">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Questions</span>
                  <span className="text-lg font-bold">45</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  "Your technical answers are solid, but try to include more specific examples from your experience."
                </p>
                <p className="text-sm text-gray-600">
                  "Good engagement and facial expressions. You appear confident and engaged during the interview."
                </p>
                <p className="text-sm text-gray-600">
                  "Consider using the STAR method more consistently when answering behavioral questions."
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Improvement Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Practice maintaining consistent eye contact
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Use the STAR method for behavioral questions
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Include more quantifiable results in your answers
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Consider enrolling in our Technical Interview course
                  </span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewsPage;
