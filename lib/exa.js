import Exa from 'exa-js';
import { getFallbackQuestions } from './questionBank';

const exa = new Exa(process.env.EXA_API_KEY || 'dummy_key'); // Prevents crash if key missing on init

export async function fetchInterviewQuestions(company, role, difficulty, interviewType) {
  if (!process.env.EXA_API_KEY) {
    console.warn('[Exa] EXA_API_KEY missing. Falling back to question bank.');
    return getFallbackQuestions(interviewType, role).slice(0, 5);
  }

  const query = `${company} ${role} interview questions ${difficulty} ${interviewType} 2024 2025`;

  try {
    const result = await exa.searchAndContents(query, {
      numResults: 10,
      type: 'neural',
      useAutoprompt: true,
      contents: {
        text: { maxCharacters: 3000 },
        highlights: {
          numSentences: 5,
          highlightsPerUrl: 3
        }
      },
      includeDomains: [
        'glassdoor.com',
        'leetcode.com',
        'geeksforgeeks.org',
        'interviewbit.com',
        'ambitionbox.com',
        'reddit.com',
        'github.com',
        'medium.com'
      ]
    });

    const rawQuestions = [];

    // Sanitize: strip markdown, URLs, HTML, numbering from a raw string
    const sanitizeQuestion = (text) => {
      let clean = text;
      // Remove markdown images: ![alt](url)
      clean = clean.replace(/!\[.*?\]\(.*?\)/g, '');
      // Remove markdown links: [text](url) -> text
      clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
      // Remove raw URLs
      clean = clean.replace(/https?:\/\/[^\s)]+/g, '');
      // Remove HTML tags
      clean = clean.replace(/<[^>]+>/g, '');
      // Remove markdown headers (##, ###)
      clean = clean.replace(/^#{1,6}\s*/gm, '');
      // Remove markdown bold/italic
      clean = clean.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1');
      // Remove leading numbering like "1.", "Q1.", "Q:", "Ans."
      clean = clean.replace(/^(\d+[\.\)]\s*|Q\d*[\.:]\s*|Ans[\.:]\s*)/i, '');
      // Collapse whitespace
      clean = clean.replace(/\s+/g, ' ').trim();
      return clean;
    };

    // Extract potential questions
    result.results.forEach((res) => {
      const sourceTexts = [...(res.highlights || []), res.text];
      
      sourceTexts.forEach((textBlock) => {
        if (!textBlock) return;
        
        const lines = textBlock.split(/\n|(?<=\?)\s/);
        
        lines.forEach((line) => {
          const sanitized = sanitizeQuestion(line);
          if (sanitized.length > 15 && sanitized.length < 300) {
            // Must look like a real question, not a fragment
            if (
              sanitized.endsWith('?') || 
              /^(what|how|why|explain|describe|design|tell me|can you|discuss|compare|walk)/i.test(sanitized)
            ) {
              // Reject if it still contains leftover junk
              if (!/[<>{}[\]]/.test(sanitized) && !rawQuestions.includes(sanitized)) {
                rawQuestions.push(sanitized);
              }
            }
          }
        });
      });
    });

    // If we have fewer than 5 valid questions, augment with fallbacks
    if (rawQuestions.length < 5) {
      console.log(`[Exa] Only found ${rawQuestions.length} questions for query: "${query}". Supplementing with fallback.`);
      const fallbacks = getFallbackQuestions(interviewType, role);
      
      for (const f of fallbacks) {
        if (rawQuestions.length >= 10) break;
        if (!rawQuestions.includes(f)) {
          rawQuestions.push(f);
        }
      }
    }

    return rawQuestions.slice(0, 20);

  } catch (error) {
    console.error(`[Exa] Failed to fetch questions for query "${query}". Using fallback. Error:`, error.message);
    // Never throw - graceful degradation
    return getFallbackQuestions(interviewType, role).slice(0, 10);
  }
}

/**
 * Fetch deep company research data using 5 parallel Exa queries
 */
export async function fetchCompanyData(company, role) {
  if (!process.env.EXA_API_KEY) {
    console.warn('[Exa] EXA_API_KEY missing for fetchCompanyData. Returning empty structures.');
    return {
      interviewExperiences: [], cultureReviews: [], techStackData: [],
      salaryData: [], recentNews: [], allSources: [], fetchedAt: new Date()
    };
  }

  const roleContext = role || 'software engineer';
  const queries = [
    {
      q: `${company} ${roleContext} interview experience 2024 2025`,
      domains: ['glassdoor.com', 'ambitionbox.com', 'leetcode.com', 'reddit.com', 'geeksforgeeks.org', 'interviewbit.com', 'medium.com', 'naukri.com/blog']
    },
    {
      q: `${company} company culture work life balance glassdoor reviews`,
      domains: ['glassdoor.com', 'ambitionbox.com', 'reddit.com', 'comparably.com', 'teamblind.com']
    },
    {
      q: `${company} tech stack engineering blog technology used`,
      domains: ['stackshare.io', 'medium.com', 'github.com', 'techcrunch.com', 'dev.to'] // removed engineering.*.com due to Exa domain limits, usually single domain matches
    },
    {
      q: `${company} salary ${roleContext} ambitionbox package CTC`,
      domains: ['ambitionbox.com', 'glassdoor.com', 'levels.fyi', 'naukri.com', 'payscale.com', 'linkedin.com']
    },
    {
      q: `${company} recent news 2024 2025 funding layoffs expansion`,
      domains: ['economictimes.indiatimes.com', 'techcrunch.com', 'moneycontrol.com', 'thehindu.com', 'businessinsider.in', 'inc42.com', 'entrackr.com']
    }
  ];

  // Map each query to a promise that gracefully handles failure
  const promises = queries.map(async (queryObj) => {
    try {
      const res = await exa.searchAndContents(queryObj.q, {
        numResults: 5,
        type: 'neural',
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: 2000 },
          highlights: { numSentences: 4, highlightsPerUrl: 3 }
        },
        includeDomains: queryObj.domains
      });
      return res.results.map(r => ({
        url: r.url,
        title: r.title,
        text: r.text || '',
        highlights: r.highlights || [],
        domain: new URL(r.url).hostname
      }));
    } catch (e) {
      console.error(`[Exa] Query failed: "${queryObj.q}" - ${e.message}`);
      return []; // empty array on failure
    }
  });

  const [
    interviewExperiences,
    cultureReviews,
    techStackData,
    salaryData,
    recentNews
  ] = await Promise.all(promises);

  // Collect all unique URLs
  const allUrls = new Set();
  [interviewExperiences, cultureReviews, techStackData, salaryData, recentNews].flat().forEach(r => allUrls.add(r.url));

  return {
    interviewExperiences,
    cultureReviews,
    techStackData,
    salaryData,
    recentNews,
    allSources: Array.from(allUrls),
    fetchedAt: new Date()
  };
}

/**
 * Fetch person profile and company news for outreach personalization
 */
export async function fetchPersonProfile(linkedinUrl, company) {
  if (!process.env.EXA_API_KEY) {
    console.warn('[Exa] EXA_API_KEY missing. Returning fallback person profile.');
    return {
      rawLinkedInText: '',
      highlights: [],
      recentPosts: [],
      careerHistory: [],
      skills: [],
      companyNews: [],
      dataFound: false,
      source: 'exa'
    };
  }

  let personRes = null;
  let newsRes = null;
  let dataFound = false;

  try {
    const promises = [];

    // Search 1: LinkedIn profile
    if (linkedinUrl) {
      promises.push(
        exa.searchAndContents(linkedinUrl, {
          type: 'auto',
          livecrawl: 'always',
          contents: {
            text: { maxCharacters: 3000 },
            highlights: {
              numSentences: 5,
              highlightsPerUrl: 5,
              query: 'experience skills projects posts achievements'
            }
          }
        }).catch(err => {
          console.warn('[Exa] URL search failed:', err.message);
          return null;
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Search 2: Company news
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    if (company) {
      promises.push(
        exa.searchAndContents(`${company} latest news product launch 2024 2025`, {
          numResults: 3,
          type: 'neural',
          useAutoprompt: true,
          startPublishedDate: ninetyDaysAgo,
          contents: {
            text: { maxCharacters: 800 },
            highlights: { numSentences: 2, highlightsPerUrl: 2 }
          }
        }).catch(err => {
          console.warn('[Exa] Company news search failed:', err.message);
          return null;
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    const [linkedinResult, companyNewsResult] = await Promise.all(promises);

    let rawLinkedInText = '';
    let highlights = [];
    
    if (linkedinResult && linkedinResult.results && linkedinResult.results.length > 0) {
      const res = linkedinResult.results[0];
      rawLinkedInText = res.text || '';
      highlights = res.highlights || [];
      dataFound = true;
    }

    let companyNews = [];
    if (companyNewsResult && companyNewsResult.results) {
      companyNews = companyNewsResult.results.map(r => r.title || '').filter(t => t);
    }

    // Basic extraction heuristics
    const recentPosts = [];
    const careerHistory = [];
    const skills = [];

    if (rawLinkedInText) {
      const lower = rawLinkedInText.toLowerCase();
      // Simple heuristic for skills
      const possibleSkills = ['javascript', 'python', 'react', 'node', 'marketing', 'sales', 'aws', 'docker'];
      possibleSkills.forEach(s => {
        if (lower.includes(s)) skills.push(s);
      });
    }

    return {
      rawLinkedInText,
      highlights,
      recentPosts,
      careerHistory,
      skills,
      companyNews,
      dataFound,
      source: 'exa'
    };

  } catch (error) {
    console.error(`[Exa] Failed to fetch person profile for ${linkedinUrl}:`, error.message);
    return {
      rawLinkedInText: '', highlights: [], recentPosts: [], careerHistory: [],
      skills: [], companyNews: [], dataFound: false, source: 'exa'
    };
  }
}

