import { supabase } from '@/integrations/supabase/client';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  html_template: string;
  placeholders: any; // JSON field
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateGenerationData {
  templateId: string;
  userId: string;
  courseName: string;
  score?: number;
  completionDate?: Date;
}

export const certificateTemplateService = {
  // Get all certificate templates (admin only)
  async getTemplates(): Promise<CertificateTemplate[]> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get active templates for public use
  async getActiveTemplates(): Promise<CertificateTemplate[]> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get default template
  async getDefaultTemplate(): Promise<CertificateTemplate | null> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new template (admin only)
  async createTemplate(template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<CertificateTemplate> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update template (admin only)
  async updateTemplate(id: string, updates: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete template (admin only)
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('certificate_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Generate certificate with template
  async generateCertificate(data: CertificateGenerationData): Promise<string> {
    const { data: populatedHtml, error } = await supabase.rpc(
      'populate_certificate_template',
      {
        template_id: data.templateId,
        user_id: data.userId,
        course_name: data.courseName,
        completion_date: data.completionDate?.toISOString() || new Date().toISOString(),
        score: data.score || null
      }
    );

    if (error) throw error;
    return populatedHtml;
  },

  // Save user certificate
  async saveUserCertificate(certificateData: {
    userId: string;
    templateId: string;
    courseName: string;
    score: number;
    populatedHtml: string;
    completionData: any;
  }) {
    // Generate verification code and hash
    const verificationCode = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: certificateHash, error: hashError } = await supabase.rpc(
      'generate_certificate_hash',
      {
        user_id: certificateData.userId,
        template_id: certificateData.templateId,
        completion_data: certificateData.completionData,
        issued_date: new Date().toISOString()
      }
    );

    if (hashError) throw hashError;

    const { data, error } = await supabase
      .from('user_certificates')
      .insert([{
        user_id: certificateData.userId,
        certificate_id: '00000000-0000-0000-0000-000000000000', // Placeholder for existing structure
        template_id: certificateData.templateId,
        verification_code: verificationCode,
        score: certificateData.score,
        completion_data: certificateData.completionData,
        populated_html: certificateData.populatedHtml,
        certificate_hash: certificateHash,
        is_active: true
      }])
      .select(`
        *,
        certificate_templates:template_id (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }
};