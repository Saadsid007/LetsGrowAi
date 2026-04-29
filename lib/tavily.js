const TAVILY_BASE = 'https://api.tavily.com/search';

const INCLUDED_DOMAINS = [
  'youtube.com',
  'freecodecamp.org',
  'docs.docker.com',
  'developer.mozilla.org',
  'roadmap.sh',
  'geeksforgeeks.org',
  'leetcode.com',
  'coursera.org',
  'udemy.com'
];

function determineTypeFromDomain(domain) {
  if (domain.includes('youtube.com')) return 'video';
  if (domain.includes('freecodecamp.org') || domain.includes('coursera.org') || domain.includes('udemy.com')) return 'course';
  if (domain.includes('docs.') || domain.includes('developer.mozilla.org')) return 'docs';
  if (domain.includes('leetcode.com')) return 'practice';
  return 'article';
}

function estimateTimeByTopic(skill) {
  const s = skill.toLowerCase();
  if (s.includes('basic') || s.includes('intro')) return '~1 week';
  if (s.includes('react') || s.includes('node') || s.includes('framework')) return '~2-3 weeks';
  if (s.includes('system design') || s.includes('architecture') || s.includes('kubernetes')) return '~1 month';
  return '~2 weeks';
}

/**
 * Fetch learning resources for missing skills using Tavily Search API.
 * Batches calls to avoid rate limits (max 5 parallel).
 */
export async function fetchLearningResources(skills, company) {
  if (!process.env.TAVILY_API_KEY) {
    console.warn('[Tavily] TAVILY_API_KEY is not set. Returning empty resources.');
    return {};
  }

  const resourceMap = {};
  
  // Process in batches of 5
  for (let i = 0; i < skills.length; i += 5) {
    const batch = skills.slice(i, i + 5);
    
    const promises = batch.map(async (skill) => {
      const query = company 
        ? `best free ${skill} course for ${company} interview 2025`
        : `best free ${skill} tutorial beginners 2025`;
        
      try {
        const res = await fetch(TAVILY_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: 'basic',
            max_results: 4,
            include_domains: INCLUDED_DOMAINS
          })
        });

        if (!res.ok) {
          console.warn(`[Tavily] Failed for skill: ${skill}, Status: ${res.status}`);
          return { skill, resources: [] };
        }

        const data = await res.json();
        const resources = (data.results || []).map(r => {
          // Extract domain from url manually since Tavily's result might not have explicit domain field
          let domain = '';
          try {
            domain = new URL(r.url).hostname.replace('www.', '');
          } catch (e) {
            domain = 'unknown';
          }
          
          return {
            title: r.title,
            url: r.url,
            domain: domain,
            type: determineTypeFromDomain(domain),
            estimatedTime: estimateTimeByTopic(skill)
          };
        });

        return { skill, resources };
      } catch (error) {
        console.error(`[Tavily Error] for skill ${skill}:`, error.message);
        return { skill, resources: [] };
      }
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(result => {
      resourceMap[result.skill] = result.resources;
    });
  }

  return resourceMap;
}

/**
 * Fetch resources for roadmap topics based on learning style and budget.
 */
export async function fetchTopicResources(topics, learningStyle, budget) {
  if (!process.env.TAVILY_API_KEY) {
    return {};
  }

  const freeDomains = [
    'youtube.com', 'freecodecamp.org', 'developer.mozilla.org',
    'roadmap.sh', 'geeksforgeeks.org', 'theodinproject.com'
  ];
  
  const paidDomains = [
    ...freeDomains,
    'udemy.com', 'coursera.org', 'zerotomastery.io',
    'frontendmasters.com', 'egghead.io'
  ];

  const includeDomains = budget === 'paid' ? paidDomains : freeDomains;
  const resourceMap = {};

  // Process in batches of 6 (Tavily rate limits)
  for (let i = 0; i < topics.length; i += 6) {
    const batch = topics.slice(i, i + 6);
    
    const promises = batch.map(async (topic) => {
      let query = `${topic} tutorial 2026`;
      
      if (learningStyle === 'video' && budget === 'free') {
        query = `${topic} tutorial free YouTube 2026 beginners`;
      } else if (learningStyle === 'video' && budget === 'paid') {
        query = `best ${topic} course Udemy Coursera 2026`;
      } else if (learningStyle === 'reading') {
        query = `${topic} documentation guide blog 2026`;
      } else if (learningStyle === 'project') {
        query = `${topic} project ideas hands-on practice 2026`;
      }

      try {
        const res = await fetch(TAVILY_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: 'basic',
            max_results: 3,
            include_domains: includeDomains
          })
        });

        if (!res.ok) return { topic, resources: [] };

        const data = await res.json();
        const resources = (data.results || []).map(r => {
          let domain = 'unknown';
          try { domain = new URL(r.url).hostname.replace('www.', ''); } catch (e) {}

          let platform = domain.split('.')[0];
          platform = platform.charAt(0).toUpperCase() + platform.slice(1);
          if (domain.includes('youtube.com')) platform = 'YouTube';
          if (domain.includes('freecodecamp.org')) platform = 'FreeCodeCamp';
          if (domain.includes('theodinproject.com')) platform = 'The Odin Project';
          if (domain.includes('roadmap.sh')) platform = 'Roadmap.sh';

          const isFree = ['youtube.com', 'freecodecamp.org', 'developer.mozilla.org', 'roadmap.sh', 'theodinproject.com'].some(d => domain.includes(d));

          let estMins = 60; // default 1 hour
          if (domain.includes('youtube.com')) estMins = 60;
          if (domain.includes('freecodecamp.org')) estMins = 240;
          if (domain.includes('udemy.com') || domain.includes('coursera.org')) estMins = 480;
          if (domain.includes('mozilla.org')) estMins = 30;
          
          return {
            title: r.title,
            url: r.url,
            domain,
            platform,
            type: determineTypeFromDomain(domain),
            estimatedMinutes: estMins,
            isFree
          };
        });

        return { topic, resources };
      } catch (e) {
        console.error(`[Tavily] Error fetching for topic ${topic}`, e);
        return { topic, resources: [] };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => { resourceMap[r.topic] = r.resources; });
  }

  return resourceMap;
}
