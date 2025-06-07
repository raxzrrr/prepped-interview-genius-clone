
import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Eye, File } from 'lucide-react';

const ReportsPage: React.FC = () => {
  // Dummy data for interview reports
  const reports = [
    {
      id: '1',
      title: 'Frontend Developer Mock Interview',
      date: 'April 25, 2025',
      questions: 15,
      duration: '45 min',
      score: 82
    },
    {
      id: '2',
      title: 'System Design Interview Practice',
      date: 'April 18, 2025',
      questions: 8,
      duration: '55 min',
      score: 76
    },
    {
      id: '3',
      title: 'Behavioral Interview Session',
      date: 'April 10, 2025',
      questions: 12,
      duration: '38 min',
      score: 90
    }
  ];

  const handleViewReport = (id: string) => {
    console.log(`Viewing report with ID: ${id}`);
    // This would navigate to a detailed report page
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="mt-2 text-gray-600">
            Access your interview performance reports and analytics
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{report.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Clock className="mr-1 h-3 w-3" /> {report.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Questions</p>
                    <p className="font-medium">{report.questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{report.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Score</p>
                    <p className="font-medium">{report.score}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        report.score >= 85 ? 'bg-green-500' : 
                        report.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => handleViewReport(report.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Report
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <File className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No reports yet</h3>
            <p className="mt-2 text-gray-600">Complete your first interview to generate a report.</p>
            <Button className="mt-4">Schedule Interview</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
