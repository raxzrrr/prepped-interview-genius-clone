import { supabase } from '@/integrations/supabase/client';

interface UploadOptions {
  fileData: string;
  filePath: string;
  bucket: string;
  metadata?: any;
}

interface DeleteOptions {
  filePath: string;
  bucket: string;
  permanent?: boolean;
}

export const adminUploadService = {
  /**
   * Upload a file using admin privileges (bypasses RLS)
   */
  async upload({ fileData, filePath, bucket, metadata }: UploadOptions) {
    const { data, error } = await supabase.functions.invoke('admin-upload', {
      body: {
        action: 'upload',
        fileData,
        filePath,
        bucket,
        metadata
      }
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Permanently delete a file from both storage and database
   */
  async delete({ filePath, bucket }: Omit<DeleteOptions, 'permanent'>) {
    const { data, error } = await supabase.functions.invoke('admin-upload', {
      body: {
        action: 'delete',
        filePath,
        bucket
      }
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Upload interview resource with metadata
   */
  async uploadInterviewResource(
    fileData: string,
    title: string,
    description: string | null,
    fileName: string
  ) {
    // Convert base64 to get file size
    const base64Data = fileData.split(',')[1];
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileSize = bytes.length;

    const filePath = `${Date.now()}-${fileName}`;

    return this.upload({
      fileData,
      filePath,
      bucket: 'interview-resources',
      metadata: {
        title,
        description,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        is_active: true
      }
    });
  }
};