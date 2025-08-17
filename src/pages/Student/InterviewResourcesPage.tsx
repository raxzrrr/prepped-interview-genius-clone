import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

interface InterviewResource {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const InterviewResourcesPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const { subscription, hasProPlan } = useSubscription();
  const isProUser = hasProPlan();
  const [resources, setResources] = useState<InterviewResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_resources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch interview resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: InterviewResource) => {
    if (!isProUser) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to access interview resources",
        variant: "destructive",
      });
      return;
    }

    setDownloading(resource.id);
    try {
      const { data, error } = await supabase.storage
        .from('interview-resources')
        .download(resource.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Resource downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download resource",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Resources</h1>
            <p className="mt-2 text-muted-foreground">
              Access premium interview preparation materials
            </p>
          </div>
          {!isProUser && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Lock className="mr-1 h-3 w-3" />
              Pro Feature
            </Badge>
          )}
        </div>

        {!isProUser && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-800">Upgrade to Pro</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Get access to premium interview resources including system design guides, 
                    coding practice materials, and behavioral interview frameworks.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/settings'}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Available Resources ({resources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading resources...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No resources available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back later for new interview preparation materials.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isProUser ? 'hover:bg-muted/50' : 'opacity-75'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{resource.title}</h4>
                        {!isProUser && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(resource.file_size)}</span>
                        <span>PDF Document</span>
                        <span>Added {new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant={isProUser ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleDownload(resource)}
                        disabled={!isProUser || downloading === resource.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === resource.id ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isProUser && resources.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> These resources are regularly updated. 
              Check back frequently for new materials to enhance your interview preparation.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewResourcesPage;