import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { certificateTemplateService, CertificateTemplate } from '@/services/certificateTemplateService';

interface TemplateFormData {
  name: string;
  description: string;
  html_template: string;
  placeholders: any;
  is_active: boolean;
  is_default: boolean;
}

export const CertificateTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    html_template: '',
    placeholders: ['user_name', 'course_name', 'completion_date', 'company_name', 'score'],
    is_active: true,
    is_default: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificateTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificate templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTemplate) {
        await certificateTemplateService.updateTemplate(editingTemplate.id, formData);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      } else {
        await certificateTemplateService.createTemplate(formData);
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
      }
      
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await certificateTemplateService.deleteTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      html_template: '',
      placeholders: ['user_name', 'course_name', 'completion_date', 'company_name', 'score'],
      is_active: true,
      is_default: false
    });
    setIsCreateModalOpen(false);
    setEditingTemplate(null);
  };

  const startEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      html_template: template.html_template,
      placeholders: template.placeholders,
      is_active: template.is_active,
      is_default: template.is_default
    });
    setIsCreateModalOpen(true);
  };

  const generatePreview = (template: CertificateTemplate) => {
    let preview = template.html_template;
    preview = preview.replace(/\{\{user_name\}\}/g, 'John Doe');
    preview = preview.replace(/\{\{course_name\}\}/g, 'Sample Course');
    preview = preview.replace(/\{\{completion_date\}\}/g, 'January 15, 2024');
    preview = preview.replace(/\{\{company_name\}\}/g, 'cyrobox solutions');
    preview = preview.replace(/\{\{score\}\}/g, '95%');
    return preview;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Certificate Templates</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="html_template">HTML Template</Label>
                <Textarea
                  id="html_template"
                  value={formData.html_template}
                  onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                  className="h-96 font-mono text-sm"
                  placeholder="Enter HTML template with placeholders: {user_name}, {course_name}, {completion_date}, {company_name}, {score}"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Available placeholders: {'{'}user_name{'}'}, {'{'}course_name{'}'}, {'{'}completion_date{'}'}, {'{'}company_name{'}'}, {'{'}score{'}'}
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Default Template</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && <Badge variant="secondary">Default</Badge>}
                    {!template.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Preview: {template.name}</DialogTitle>
                      </DialogHeader>
                      <div 
                        className="border rounded-lg p-4"
                        dangerouslySetInnerHTML={{ __html: generatePreview(template) }}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(template.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(template.created_at).toLocaleDateString()}
                {template.updated_at !== template.created_at && (
                  <span> • Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No certificate templates found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first template to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};