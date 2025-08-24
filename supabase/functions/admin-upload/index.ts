import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { action, fileData, filePath, bucket, metadata } = await req.json();

    if (action === 'upload') {
      // Convert base64 to blob
      const base64Data = fileData.split(',')[1];
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Upload to storage using service role
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save metadata to database if provided
      if (metadata) {
        const { error: dbError } = await supabase
          .from('interview_resources')
          .insert(metadata);

        if (dbError) {
          // Rollback storage upload
          await supabase.storage.from(bucket).remove([filePath]);
          throw dbError;
        }
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'delete') {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Mark the resource as inactive in the database
      const { error: dbError } = await supabase
        .from('interview_resources')
        .update({ is_active: false })
        .eq('file_path', filePath);

      if (dbError) {
        console.error('Error marking resource as inactive:', dbError);
        // Don't throw here since file is already deleted from storage
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Admin upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});