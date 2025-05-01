
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

interface ResumeAnalysisResultsProps {
  analysis: {
    skills: string[];
    suggested_role: string;
    strengths: string[];
    areas_to_improve: string[];
    suggestions: string;
  };
}

const ResumeAnalysisResults: React.FC<ResumeAnalysisResultsProps> = ({ analysis }) => {
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
            {analysis.suggested_role}
          </Badge>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Skills Identified</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.skills.map((skill, index) => (
              <Badge key={index} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Strengths</h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Areas to Improve</h3>
          <ul className="space-y-2">
            {analysis.areas_to_improve.map((area, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Suggestions</h3>
          <p className="text-gray-700">{analysis.suggestions}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalysisResults;
