interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  posted?: string;
  type?: string;
  experience?: string;
  salary?: string;
  source?: string;
}

interface WebSearchResult {
  title: string;
  content: string;
  url: string;
}

class JobSearchService {
  async searchJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('real-job-search', {
        body: {
          roles,
          locations
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Job search failed: ${error.message}`);
      }

      if (data && data.jobs && Array.isArray(data.jobs)) {
        return data.jobs;
      }

      return [];
    } catch (error) {
      console.error('Error in job search:', error);
      throw error;
    }
  }
}

export const websearch = new JobSearchService();