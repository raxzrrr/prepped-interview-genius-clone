import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, ExternalLink, Briefcase, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  experience: string;
  jobType: string;
  skills: string[];
  description: string;
  applyUrl: string;
  postedDate: string;
}

interface JobRecommendationsProps {
  userSkills?: string[];
  courseCompleted?: string;
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({ 
  userSkills = [],
  courseCompleted = ""
}) => {
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading job recommendations
    const loadJobRecommendations = () => {
      setLoading(true);
      
      // Mock job data for India - in a real app, this would come from a job API
      const mockJobs: JobRecommendation[] = [
        {
          id: '1',
          title: 'Frontend Developer',
          company: 'TechCorp India',
          location: 'Bangalore, Karnataka',
          salary: '₹8-12 LPA',
          experience: '2-4 years',
          jobType: 'Full-time',
          skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
          description: 'Join our dynamic team to build cutting-edge web applications using React and modern frontend technologies.',
          applyUrl: 'https://example.com/apply/1',
          postedDate: '2024-01-15'
        },
        {
          id: '2',
          title: 'React Developer',
          company: 'StartupXYZ',
          location: 'Mumbai, Maharashtra',
          salary: '₹6-10 LPA',
          experience: '1-3 years',
          jobType: 'Full-time',
          skills: ['React', 'Node.js', 'Redux', 'JavaScript'],
          description: 'Looking for passionate React developers to join our growing startup and work on innovative products.',
          applyUrl: 'https://example.com/apply/2',
          postedDate: '2024-01-12'
        },
        {
          id: '3',
          title: 'Full Stack Developer',
          company: 'Digital Solutions Pvt Ltd',
          location: 'Hyderabad, Telangana',
          salary: '₹10-15 LPA',
          experience: '3-5 years',
          jobType: 'Full-time',
          skills: ['React', 'Node.js', 'MongoDB', 'Express', 'AWS'],
          description: 'Build end-to-end web applications and work with modern cloud technologies in our collaborative environment.',
          applyUrl: 'https://example.com/apply/3',
          postedDate: '2024-01-10'
        },
        {
          id: '4',
          title: 'UI/UX Developer',
          company: 'Design Studio Inc',
          location: 'Pune, Maharashtra',
          salary: '₹7-11 LPA',
          experience: '2-4 years',
          jobType: 'Full-time',
          skills: ['React', 'CSS', 'JavaScript', 'Figma', 'Adobe XD'],
          description: 'Create beautiful and functional user interfaces while collaborating closely with our design team.',
          applyUrl: 'https://example.com/apply/4',
          postedDate: '2024-01-08'
        },
        {
          id: '5',
          title: 'JavaScript Developer',
          company: 'WebTech Solutions',
          location: 'Chennai, Tamil Nadu',
          salary: '₹5-9 LPA',
          experience: '1-3 years',
          jobType: 'Full-time',
          skills: ['JavaScript', 'React', 'Vue.js', 'HTML', 'CSS'],
          description: 'Work on diverse web projects using modern JavaScript frameworks and contribute to our open-source initiatives.',
          applyUrl: 'https://example.com/apply/5',
          postedDate: '2024-01-05'
        },
        {
          id: '6',
          title: 'Senior Frontend Engineer',
          company: 'Enterprise Corp',
          location: 'Gurgaon, Haryana',
          salary: '₹15-22 LPA',
          experience: '5-8 years',
          jobType: 'Full-time',
          skills: ['React', 'TypeScript', 'GraphQL', 'Jest', 'Webpack'],
          description: 'Lead frontend development initiatives and mentor junior developers in our enterprise-scale applications.',
          applyUrl: 'https://example.com/apply/6',
          postedDate: '2024-01-03'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setJobs(mockJobs);
        setLoading(false);
      }, 1500);
    };

    loadJobRecommendations();
  }, [userSkills, courseCompleted]);

  const handleApply = (job: JobRecommendation) => {
    // In a real app, this would handle the application process
    toast({
      title: "Redirecting to Application",
      description: `Opening application for ${job.title} at ${job.company}`,
    });
    
    // Open in new tab
    window.open(job.applyUrl, '_blank');
  };

  const calculateMatchScore = (jobSkills: string[]): number => {
    if (userSkills.length === 0) return 75; // Default match score
    
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    return Math.min(95, Math.max(60, Math.round((matchingSkills.length / jobSkills.length) * 100)));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Finding relevant job opportunities...</p>
          <p className="text-sm text-muted-foreground mt-2">Searching across India</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Recommended Jobs in India</h2>
        <p className="text-muted-foreground">
          Based on your skills and course completion{courseCompleted && ` in ${courseCompleted}`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {jobs.map((job) => {
          const matchScore = calculateMatchScore(job.skills);
          
          return (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4" />
                      {job.company}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={matchScore >= 80 ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {matchScore}% match
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {job.experience}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {job.jobType}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {job.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Posted: {new Date(job.postedDate).toLocaleDateString()}
                  </p>
                  <Button 
                    onClick={() => handleApply(job)}
                    className="flex items-center gap-2"
                  >
                    Apply Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Looking for more opportunities?
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.naukri.com/', '_blank')}
          >
            Naukri.com
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}
          >
            LinkedIn Jobs
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.indeed.co.in/', '_blank')}
          >
            Indeed India
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobRecommendations;