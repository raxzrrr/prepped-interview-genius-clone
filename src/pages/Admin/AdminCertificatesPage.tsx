import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  CheckCircle,
  Gift
} from 'lucide-react';
import { useCertificates } from '@/hooks/useCertificates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminCertificatesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { availableCertificates, loading } = useCertificates();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    title: '',
    description: '',
    certificate_type: 'completion',
    requirements: {}
  });

  // Redirect if not admin
  if (!isAdmin()) {
    return <Navigate to="/login" />;
  }

  const handleCreateCertificate = async () => {
    try {
      const { error } = await supabase
        .from('certificates')
        .insert([newCertificate]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certificate template created successfully",
      });

      setIsCreating(false);
      setNewCertificate({
        title: '',
        description: '',
        certificate_type: 'completion',
        requirements: {}
      });
      
      // Refresh the page to show new certificate
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleIssueInternshipCertificate = async (userId: string, userName: string) => {
    try {
      // Find the internship certificate template
      const internshipCert = availableCertificates.find(
        cert => cert.certificate_type === 'internship'
      );

      if (!internshipCert) {
        toast({
          title: "Error",
          description: "Internship certificate template not found",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_certificates')
        .insert([{
          user_id: userId,
          certificate_id: internshipCert.id,
          completion_data: {
            issued_by_admin: true,
            admin_notes: `Internship certificate issued for ${userName}`
          }
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Internship certificate issued to ${userName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage certification templates
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Certificate
          </Button>
        </div>

        {/* Create Certificate Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Certificate Template</CardTitle>
              <CardDescription>
                Define a new certificate that can be earned by students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Certificate Title</label>
                <Input
                  value={newCertificate.title}
                  onChange={(e) => setNewCertificate({
                    ...newCertificate,
                    title: e.target.value
                  })}
                  placeholder="e.g., Advanced Interview Skills Certificate"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newCertificate.description}
                  onChange={(e) => setNewCertificate({
                    ...newCertificate,
                    description: e.target.value
                  })}
                  placeholder="Describe what this certificate represents..."
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleCreateCertificate}>
                  Create Certificate
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Templates
            </CardTitle>
            <CardDescription>
              Manage existing certificate templates and their requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCertificates.map((cert) => (
                <Card key={cert.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        <Badge 
                          variant="outline"
                          className={
                            cert.certificate_type === 'internship' 
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : cert.auto_issue
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {cert.certificate_type === 'internship' ? 'Internship' : 
                           cert.auto_issue ? 'Auto-Issue' : 'Manual'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {cert.certificate_type === 'internship' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // This would open a user selection modal
                              // For now, we'll show a placeholder
                              toast({
                                title: "Feature Coming Soon",
                                description: "User selection interface will be added soon",
                              });
                            }}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            Issue
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {cert.description}
                    </p>
                    
                    {/* Requirements Display */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Requirements:</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {cert.requirements?.min_interviews && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {cert.requirements.min_interviews} interviews
                          </div>
                        )}
                        {cert.requirements?.min_score && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {cert.requirements.min_score}% min score
                          </div>
                        )}
                        {cert.requirements?.admin_approval && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Admin approval required
                          </div>
                        )}
                        {Object.keys(cert.requirements || {}).length === 0 && (
                          <div className="text-muted-foreground">No specific requirements</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Settings className="h-3 w-3" />
                        {cert.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {cert.certificate_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableCertificates.length === 0 && (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificates created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first certificate template to get started
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Certificate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificatesPage;
