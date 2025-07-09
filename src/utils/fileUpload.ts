
import { supabase } from '@/integrations/supabase/client';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

export const uploadVideoFile = async (
  file: File,
  courseId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ path: string; url: string } | null> => {
  try {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      onProgress?.({ progress: 0, status: 'error', message: 'Invalid file type. Please upload MP4, WebM, MOV, or AVI files.' });
      return null;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      onProgress?.({ progress: 0, status: 'error', message: 'File size too large. Maximum size is 500MB.' });
      return null;
    }

    onProgress?.({ progress: 10, status: 'uploading', message: 'Starting upload...' });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${courseId}/${timestamp}_${sanitizedName}`;

    onProgress?.({ progress: 30, status: 'uploading', message: 'Uploading file...' });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      onProgress?.({ progress: 0, status: 'error', message: `Upload failed: ${error.message}` });
      return null;
    }

    onProgress?.({ progress: 90, status: 'uploading', message: 'Finalizing upload...' });

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(data.path);

    onProgress?.({ progress: 100, status: 'success', message: 'Upload completed successfully!' });

    return {
      path: data.path,
      url: publicUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    onProgress?.({ progress: 0, status: 'error', message: 'Upload failed. Please try again.' });
    return null;
  }
};

export const deleteVideoFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('course-videos')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

export const generateThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Capture frame at 1 second
    };

    video.onseeked = () => {
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      } else {
        reject('Could not generate thumbnail');
      }
    };

    video.onerror = () => reject('Error loading video');
    video.src = URL.createObjectURL(videoFile);
  });
};
