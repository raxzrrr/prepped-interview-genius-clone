import React, { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  MapPin, 
  Plus, 
  X, 
  ExternalLink, 
  Building2, 
  Clock,
  Briefcase,
  Loader2
} from 'lucide-react';
import { websearch } from '@/services/jobSearchService';

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  posted?: string;
  type?: string;
}

const JobsPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<string[]>(['']);
  const [locations, setLocations] = useState<string[]>(['']);
  const [isSearching, setIsSearching] = useState(false);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const addRole = () => {
    setRoles([...roles, '']);
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const updateRole = (index: number, value: string) => {
    const newRoles = [...roles];
    newRoles[index] = value;
    setRoles(newRoles);
  };

  const addLocation = () => {
    setLocations([...locations, '']);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const searchJobs = async () => {
    const validRoles = roles.filter(role => role.trim() !== '');
    const validLocations = locations.filter(location => location.trim() !== '');

    if (validRoles.length === 0) {
      toast({
        title: "Please add at least one role",
        variant: "destructive",
      });
      return;
    }

    if (validLocations.length === 0) {
      toast({
        title: "Please add at least one location",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setJobResults([]);
    setHasSearched(false);

    try {
      const results = await websearch.searchJobs(validRoles, validLocations);
      setJobResults(results);
      setHasSearched(true);
      
      toast({
        title: `Found ${results.length} job opportunities`,
        description: "Results from various job platforms",
      });
    } catch (error) {
      console.error('Job search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to fetch job listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Search</h1>
          <p className="text-muted-foreground mt-1">
            Find job opportunities that match your skills and preferred locations
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Parameters
            </CardTitle>
            <CardDescription>
              Add multiple roles and locations to find relevant job openings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Roles Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Job Roles</h3>
                <Button variant="outline" size="sm" onClick={addRole}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>
              
              <div className="space-y-2">
                {roles.map((role, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., Software Engineer, Data Scientist"
                        value={role}
                        onChange={(e) => updateRole(index, e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {roles.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeRole(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Locations Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Locations</h3>
                <Button variant="outline" size="sm" onClick={addLocation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
              
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., New York, San Francisco, Remote"
                        value={location}
                        onChange={(e) => updateLocation(index, e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {locations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeLocation(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={searchJobs} 
              disabled={isSearching}
              className="w-full"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching Jobs...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Jobs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {(hasSearched || isSearching) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Job Results</h2>
              {jobResults.length > 0 && (
                <Badge variant="secondary">
                  {jobResults.length} opportunities found
                </Badge>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Searching for job opportunities...</p>
                </div>
              </div>
            )}

            {!isSearching && jobResults.length === 0 && hasSearched && (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">
                    Try different roles or locations to find more opportunities
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {jobResults.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-primary">{job.title}</h3>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          {job.posted && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{job.posted}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {job.type && (
                          <Badge variant="outline">{job.type}</Badge>
                        )}
                        {job.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;