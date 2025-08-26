import { WebCrawlService } from '@/utils/WebCrawlService';

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
  source: string;
}

class JobSearchService {
  async searchJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
    try {
      console.log('Starting web crawl job search for roles:', roles, 'locations:', locations);
      
      // Use web crawling service instead of API calls
      const results = await WebCrawlService.searchJobs(roles, locations);
      
      console.log(`Web crawl found ${results.length} jobs`);
      return results;
    } catch (error) {
      console.error('Error in web crawl job search:', error);
      throw new Error('Failed to search for jobs through web crawling. Please try again with different search terms.');
    }
  }

  async verifyJobUrl(url: string): Promise<boolean> {
    return WebCrawlService.verifyJobUrl(url);
  }
}

export const websearch = new JobSearchService();