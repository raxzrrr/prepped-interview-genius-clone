
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

interface ResumeAnalysisResultsProps {
  analysis: {
    skills?: string[];
    suggested_role?: string;
    strengths?: string[];
    areas_to_improve?: string[];
    suggestions?: string;
    job_openings?: {
      role: string;
      locations: string[];
      global?: string[];
    }[];
  };
}

const ResumeAnalysisResults: React.FC<ResumeAnalysisResultsProps> = ({ analysis }) => {
  // Provide fallback values for all properties
  const {
    skills = [],
    suggested_role = 'Not specified',
    strengths = [],
    areas_to_improve = [],
    suggestions = 'No suggestions available',
    job_openings = []
  } = analysis || {};

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-brand-purple" />
          Resume Analysis Results
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Suggested Role</h3>
          <Badge variant="outline" className="bg-brand-purple/10 text-brand-purple border-brand-purple">
            {suggested_role}
          </Badge>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Skills Identified</h3>
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No skills identified</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Strengths</h3>
          <ul className="space-y-2">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No strengths identified</p>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Areas to Improve</h3>
          <ul className="space-y-2">
            {areas_to_improve.length > 0 ? (
              areas_to_improve.map((area, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{area}</span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No areas to improve identified</p>
            )}
          </ul>
        </div>

        {job_openings && job_openings.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Relevant Job Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {job_openings.map((job, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-900 mb-2">{job.role}</div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>
                      <span className="font-medium">Indian Locations:</span> {job.locations.join(' • ')}
                    </div>
                    {job.global && job.global.length > 0 && (
                      <div>
                        <span className="font-medium">Global Opportunities:</span> {job.global.join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-2">Suggestions</h3>
          <p className="text-gray-700">{suggestions}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalysisResults;
