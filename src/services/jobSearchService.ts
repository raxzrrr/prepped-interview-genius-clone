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
}

interface WebSearchResult {
  title: string;
  content: string;
  url: string;
}

class JobSearchService {
  async searchJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
    try {
      const response = await fetch('/api/functions/v1/gemini-job-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles,
          locations
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.jobs && Array.isArray(data.jobs)) {
        return data.jobs;
      }

      throw new Error('Invalid response format from job search API');
    } catch (error) {
      console.error('Error in job search:', error);
      throw error;
    }
  }

}

export const websearch = new JobSearchService();