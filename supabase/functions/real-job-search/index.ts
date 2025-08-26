import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  description: string;
  url: string;
  publication_date: string;
  job_type: string;
  salary?: string;
}

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

async function fetchRemotiveJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
  try {
    console.log('Fetching from Remotive API...');
    const response = await fetch('https://remotive.com/api/remote-jobs?limit=50');
    
    if (!response.ok) {
      console.error('Remotive API error:', response.status);
      return [];
    }

    const data = await response.json();
    const jobs: RemotiveJob[] = data.jobs || [];
    
    return jobs
      .filter(job => {
        const titleLower = job.title.toLowerCase();
        const locationLower = job.candidate_required_location.toLowerCase();
        
        const matchesRole = roles.some(role => 
          titleLower.includes(role.toLowerCase()) ||
          role.toLowerCase().includes(titleLower.split(' ')[0])
        );
        
        const matchesLocation = locations.some(location => 
          locationLower.includes(location.toLowerCase()) ||
          location.toLowerCase() === 'remote' ||
          locationLower.includes('anywhere')
        );
        
        return matchesRole && matchesLocation;
      })
      .map(job => ({
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location,
        description: job.description.substring(0, 200) + '...',
        url: job.url,
        posted: new Date(job.publication_date).toLocaleDateString(),
        type: job.job_type,
        salary: job.salary,
        source: 'remotive.com'
      }));
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error);
    return [];
  }
}

async function fetchArbeitnowJobs(roles: string[], locations: string[]): Promise<JobResult[]> {
  try {
    console.log('Fetching from Arbeitnow API...');
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
    
    if (!response.ok) {
      console.error('Arbeitnow API error:', response.status);
      return [];
    }

    const data = await response.json();
    const jobs: ArbeitnowJob[] = data.data || [];
    
    return jobs
      .filter(job => {
        const titleLower = job.title.toLowerCase();
        const locationLower = job.location.toLowerCase();
        const tagsLower = job.tags.map(tag => tag.toLowerCase()).join(' ');
        
        const matchesRole = roles.some(role => 
          titleLower.includes(role.toLowerCase()) ||
          tagsLower.includes(role.toLowerCase()) ||
          role.toLowerCase().includes(titleLower.split(' ')[0])
        );
        
        const matchesLocation = locations.some(location => 
          locationLower.includes(location.toLowerCase()) ||
          location.toLowerCase() === 'remote' && job.remote ||
          locationLower.includes('anywhere')
        );
        
        return matchesRole && matchesLocation;
      })
      .map(job => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.remote ? 'Remote' : job.location,
        description: job.description.substring(0, 200) + '...',
        url: job.url,
        posted: new Date(job.created_at * 1000).toLocaleDateString(),
        type: job.job_types.join(', '),
        source: 'arbeitnow.com'
      }));
  } catch (error) {
    console.error('Error fetching Arbeitnow jobs:', error);
    return [];
  }
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Try HEAD request first
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (headError) {
      // If HEAD fails, try GET request
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);
      return response.ok;
    }
  } catch (error) {
    console.log(`URL verification failed for ${url}:`, error);
    return false;
  }
}

function removeDuplicates(jobs: JobResult[]): JobResult[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roles, locations } = await req.json();
    
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Roles array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Locations array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for jobs:', { roles, locations });

    // Fetch from multiple sources in parallel
    const [remotiveJobs, arbeitnowJobs] = await Promise.all([
      fetchRemotiveJobs(roles, locations),
      fetchArbeitnowJobs(roles, locations)
    ]);

    // Combine and remove duplicates
    let allJobs = [...remotiveJobs, ...arbeitnowJobs];
    console.log(`Combined ${allJobs.length} jobs from all sources`);
    
    if (allJobs.length === 0) {
      console.log('No jobs found from any source');
      return new Response(
        JSON.stringify({ 
          success: true,
          jobs: [],
          message: 'No jobs found for the specified criteria'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    allJobs = removeDuplicates(allJobs);
    console.log(`After deduplication: ${allJobs.length} unique jobs`);

    // Verify URLs in parallel (limit to first 15 for performance)
    const jobsToVerify = allJobs.slice(0, 15);
    const verificationResults = await Promise.all(
      jobsToVerify.map(async (job) => ({
        job,
        isValid: job.url ? await verifyUrl(job.url) : false
      }))
    );

    // Filter to only verified jobs
    const verifiedJobs = verificationResults
      .filter(result => result.isValid)
      .map(result => result.job)
      .slice(0, 10); // Limit to 10 jobs for faster response

    console.log(`Returning ${verifiedJobs.length} verified jobs`);

    return new Response(
      JSON.stringify({ 
        success: true,
        jobs: verifiedJobs,
        total: allJobs.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in real-job-search function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        jobs: [],
        error: 'Failed to fetch job listings',
        message: 'Please try again later or use different search criteria'
      }),
      { 
        status: 200, // Return 200 to avoid throwing errors in frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});