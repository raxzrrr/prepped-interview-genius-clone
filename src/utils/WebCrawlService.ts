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

export class WebCrawlService {
  private static readonly JOB_SITES = [
    {
      name: 'LinkedIn Jobs',
      baseUrl: 'https://www.linkedin.com/jobs/search',
      selector: '.job-search-card',
      titleSelector: '.base-search-card__title',
      companySelector: '.base-search-card__subtitle',
      locationSelector: '.job-search-card__location'
    },
    {
      name: 'Indeed',
      baseUrl: 'https://www.indeed.com/jobs',
      selector: '[data-jk]',
      titleSelector: '[data-testid="job-title"]',
      companySelector: '[data-testid="company-name"]',
      locationSelector: '[data-testid="job-location"]'
    },
    {
      name: 'Glassdoor',
      baseUrl: 'https://www.glassdoor.com/Job/jobs.htm',
      selector: '.react-job-listing',
      titleSelector: '.jobLink',
      companySelector: '.jobEmployer',
      locationSelector: '.jobLocation'
    }
  ];

  static async searchJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
    try {
      const searchPromises = this.JOB_SITES.map(site => 
        this.crawlSite(site, roles, locations)
      );

      const results = await Promise.allSettled(searchPromises);
      const allJobs: JobResult[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        } else {
          console.error(`Failed to crawl ${this.JOB_SITES[index].name}:`, result.reason);
        }
      });

      // Remove duplicates based on title and company
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      // Limit to 20 results for performance
      return uniqueJobs.slice(0, 20);
    } catch (error) {
      console.error('Error in job search:', error);
      throw new Error('Failed to search for jobs. Please try again.');
    }
  }

  private static async crawlSite(
    site: typeof this.JOB_SITES[0], 
    roles: string[], 
    locations: string[]
  ): Promise<JobResult[]> {
    const jobs: JobResult[] = [];
    
    try {
      // For each role and location combination
      for (const role of roles.slice(0, 2)) { // Limit to 2 roles to avoid too many requests
        for (const location of locations.slice(0, 2)) { // Limit to 2 locations
          const searchUrl = this.buildSearchUrl(site.baseUrl, role, location);
          
          try {
            const siteJobs = await this.fetchJobsFromUrl(searchUrl, site, role, location);
            jobs.push(...siteJobs);
            
            // Add delay to be respectful to the websites
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error crawling ${searchUrl}:`, error);
            // Continue with next URL instead of failing completely
          }
        }
      }
    } catch (error) {
      console.error(`Error crawling site ${site.name}:`, error);
    }

    return jobs;
  }

  private static buildSearchUrl(baseUrl: string, role: string, location: string): string {
    const encodedRole = encodeURIComponent(role);
    const encodedLocation = encodeURIComponent(location);
    
    if (baseUrl.includes('linkedin.com')) {
      return `${baseUrl}?keywords=${encodedRole}&location=${encodedLocation}`;
    } else if (baseUrl.includes('indeed.com')) {
      return `${baseUrl}?q=${encodedRole}&l=${encodedLocation}`;
    } else if (baseUrl.includes('glassdoor.com')) {
      return `${baseUrl}?sc.keyword=${encodedRole}&locT=C&locId=${encodedLocation}`;
    }
    
    return `${baseUrl}?q=${encodedRole}&location=${encodedLocation}`;
  }

  private static async fetchJobsFromUrl(
    url: string, 
    site: typeof this.JOB_SITES[0], 
    role: string, 
    location: string
  ): Promise<JobResult[]> {
    // In a real implementation, this would use a proper web scraping service
    // For now, we'll return mock data that simulates crawled jobs
    
    const mockJobs: JobResult[] = [
      {
        id: `crawl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${role} - ${site.name}`,
        company: `Company from ${site.name}`,
        location: location,
        description: `Exciting ${role} opportunity found through web crawling from ${site.name}. This position offers great career growth and competitive benefits.`,
        url: url,
        posted: new Date().toLocaleDateString(),
        type: 'Full-time',
        experience: 'Mid-level',
        salary: '$80,000 - $120,000',
        source: site.name
      }
    ];

    // Simulate some variation in results
    const numResults = Math.floor(Math.random() * 3) + 1; // 1-3 results per site
    return mockJobs.slice(0, numResults).map((job, index) => ({
      ...job,
      id: `${job.id}-${index}`,
      title: `${role} ${['Developer', 'Engineer', 'Specialist', 'Analyst'][Math.floor(Math.random() * 4)]}`
    }));
  }

  private static removeDuplicates(jobs: JobResult[]): JobResult[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Method to verify if a URL is accessible
  static async verifyJobUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}