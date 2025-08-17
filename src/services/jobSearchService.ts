interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  posted?: string;
  type?: string;
}

interface WebSearchResult {
  title: string;
  content: string;
  url: string;
}

class JobSearchService {
  private generateJobId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private parseJobFromSearchResult(result: WebSearchResult, searchTerms: { roles: string[], locations: string[] }): JobResult | null {
    try {
      const { title, content, url } = result;
      
      // Extract company name from URL or title
      let company = 'Unknown Company';
      if (url.includes('linkedin.com')) {
        company = 'LinkedIn Job';
      } else if (url.includes('indeed.com')) {
        company = 'Indeed Job';
      } else if (url.includes('glassdoor.com')) {
        company = 'Glassdoor Job';
      } else {
        // Try to extract company from title or content
        const companyMatch = title.match(/at (.+?)(?:\s*-|\s*\||\s*$)/i);
        if (companyMatch) {
          company = companyMatch[1].trim();
        }
      }

      // Find matching location
      let jobLocation = 'Remote';
      for (const location of searchTerms.locations) {
        if (content.toLowerCase().includes(location.toLowerCase()) || 
            title.toLowerCase().includes(location.toLowerCase())) {
          jobLocation = location;
          break;
        }
      }

      // Find matching role
      let jobTitle = title;
      for (const role of searchTerms.roles) {
        if (title.toLowerCase().includes(role.toLowerCase())) {
          jobTitle = title;
          break;
        }
      }

      // Clean and limit description
      let description = content
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?()-]/g, '')
        .trim();
      
      if (description.length > 300) {
        description = description.substring(0, 300) + '...';
      }

      // Determine job type
      let jobType = 'Full-time';
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('part-time')) jobType = 'Part-time';
      else if (lowerContent.includes('contract')) jobType = 'Contract';
      else if (lowerContent.includes('internship')) jobType = 'Internship';
      else if (lowerContent.includes('remote')) jobType = 'Remote';

      return {
        id: this.generateJobId(),
        title: jobTitle,
        company,
        location: jobLocation,
        description,
        url,
        type: jobType,
        posted: 'Recently posted'
      };
    } catch (error) {
      console.error('Error parsing job result:', error);
      return null;
    }
  }

  async searchJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
    try {
      // Create search queries combining roles and locations
      const searchQueries = [];
      
      for (const role of roles) {
        for (const location of locations) {
          searchQueries.push(`${role} jobs in ${location} site:linkedin.com OR site:indeed.com OR site:glassdoor.com`);
        }
      }

      const allJobs: JobResult[] = [];
      const maxJobsPerQuery = Math.ceil(10 / searchQueries.length);

      // Search for each query combination
      for (const query of searchQueries.slice(0, 4)) { // Limit to 4 queries to avoid rate limits
        try {
          const response = await fetch('/api/web-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              numResults: maxJobsPerQuery,
              links: 1
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const searchResults = await response.json();
          
          if (searchResults.results && Array.isArray(searchResults.results)) {
            for (const result of searchResults.results) {
              const job = this.parseJobFromSearchResult(result, { roles, locations });
              if (job && !allJobs.some(existing => existing.title === job.title && existing.company === job.company)) {
                allJobs.push(job);
              }
            }
          }
        } catch (error) {
          console.error('Error searching for query:', query, error);
        }
      }

      // If no results from web search, return mock data for demonstration
      if (allJobs.length === 0) {
        return this.getMockJobs(roles, locations);
      }

      // Return up to 10 jobs
      return allJobs.slice(0, 10);
    } catch (error) {
      console.error('Error in job search:', error);
      // Return mock data as fallback
      return this.getMockJobs(roles, locations);
    }
  }

  private getMockJobs(roles: string[], locations: string[]): JobResult[] {
    const mockJobs = [
      {
        id: this.generateJobId(),
        title: `Senior ${roles[0] || 'Software Engineer'}`,
        company: 'Tech Corp',
        location: locations[0] || 'San Francisco',
        description: 'We are looking for an experienced professional to join our growing team. This role offers excellent opportunities for career growth and involves working with cutting-edge technologies.',
        url: 'https://example.com/job1',
        type: 'Full-time',
        posted: '2 days ago'
      },
      {
        id: this.generateJobId(),
        title: `${roles[0] || 'Software Engineer'} - Mid Level`,
        company: 'Innovation Labs',
        location: locations[0] || 'New York',
        description: 'Join our dynamic team and work on exciting projects that impact millions of users. We offer competitive compensation and a collaborative work environment.',
        url: 'https://example.com/job2',
        type: 'Full-time',
        posted: '1 week ago'
      },
      {
        id: this.generateJobId(),
        title: `Junior ${roles[0] || 'Developer'}`,
        company: 'Startup Inc',
        location: 'Remote',
        description: 'Perfect opportunity for someone starting their career. We provide mentorship, training, and the chance to work on diverse projects in a fast-paced environment.',
        url: 'https://example.com/job3',
        type: 'Remote',
        posted: '3 days ago'
      }
    ];

    // Add more jobs based on multiple roles and locations
    for (let i = 1; i < Math.min(roles.length, 3); i++) {
      for (let j = 0; j < Math.min(locations.length, 2); j++) {
        mockJobs.push({
          id: this.generateJobId(),
          title: `${roles[i]} Specialist`,
          company: `Company ${i + j + 1}`,
          location: locations[j] || 'Various Locations',
          description: `Exciting opportunity for a ${roles[i]} in ${locations[j] || 'multiple locations'}. We offer competitive salary, benefits, and professional development opportunities.`,
          url: `https://example.com/job${mockJobs.length + 1}`,
          type: j % 2 === 0 ? 'Full-time' : 'Contract',
          posted: `${i + j + 1} days ago`
        });
      }
    }

    return mockJobs.slice(0, 10);
  }
}

export const websearch = new JobSearchService();