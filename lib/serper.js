const SERPER_BASE = 'https://google.serper.dev/search';

/**
 * Perform a single Serper search
 */
async function performSerperSearch(query) {
  if (!process.env.SERPER_API_KEY) {
    console.warn('[Serper] SERPER_API_KEY is not set. Returning empty results.');
    return [];
  }

  try {
    const res = await fetch(SERPER_BASE, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 10, gl: 'in', hl: 'en' })
    });

    if (!res.ok) {
      console.warn(`[Serper] Search failed with status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const snippets = [];
    
    // Extract answer box if exists
    if (data.answerBox && data.answerBox.answer) {
      snippets.push(data.answerBox.answer);
    } else if (data.answerBox && data.answerBox.snippet) {
      snippets.push(data.answerBox.snippet);
    }
    
    // Extract knowledge graph description if exists
    if (data.knowledgeGraph && data.knowledgeGraph.description) {
      snippets.push(data.knowledgeGraph.description);
    }

    // Extract organic results
    if (data.organic && Array.isArray(data.organic)) {
      data.organic.forEach(item => {
        if (item.snippet) snippets.push(item.snippet);
      });
    }

    return snippets;
  } catch (error) {
    console.error('[Serper Error]', error.message);
    return [];
  }
}

/**
 * Searches general requirements for a specific job title and experience level
 */
export async function searchJobRequirements(jobTitle, experienceLevel) {
  const queries = [
    `${jobTitle} job description required skills ${experienceLevel} 2026`,
    `${jobTitle} developer requirements India 2026 must have skills`,
    `${jobTitle} ${experienceLevel} JD key skills technologies`
  ];

  const results = await Promise.all(queries.map(q => performSerperSearch(q)));
  
  // Flatten and deduplicate
  const allSnippets = results.flat();
  const uniqueSnippets = [...new Set(allSnippets)].filter(s => s.trim().length > 20);
  
  return uniqueSnippets;
}

/**
 * Searches requirements for a specific role at a specific company
 */
export async function searchCompanyRoleRequirements(company, role) {
  if (!process.env.SERPER_API_KEY) {
    console.warn('[Serper] SERPER_API_KEY is not set. Returning empty results.');
    return { snippets: [], sources: [] };
  }

  const queries = [
    `${company} ${role} interview required skills 2026`,
    `${company} ${role.toLowerCase()} job description skills technologies`,
    `${company} ${role} interview preparation topics DSA system design`
  ];

  try {
    const promises = queries.map(q => fetch(SERPER_BASE, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: q, num: 10, gl: 'in', hl: 'en' })
    }));

    const responses = await Promise.all(promises);
    const snippets = [];
    const sources = [];

    for (const res of responses) {
      if (!res.ok) continue;
      const data = await res.json();
      
      if (data.answerBox?.answer) snippets.push(data.answerBox.answer);
      if (data.answerBox?.snippet) snippets.push(data.answerBox.snippet);
      if (data.knowledgeGraph?.description) snippets.push(data.knowledgeGraph.description);
      
      if (data.organic && Array.isArray(data.organic)) {
        data.organic.forEach(item => {
          if (item.snippet) snippets.push(item.snippet);
          if (item.link && !sources.includes(item.link)) sources.push(item.link);
        });
      }
    }

    const uniqueSnippets = [...new Set(snippets)].filter(s => s.trim().length > 20);
    // Limit sources to top 5
    const topSources = sources.slice(0, 5);

    return { snippets: uniqueSnippets, sources: topSources };
  } catch (error) {
    console.error('[Serper Error]', error.message);
    return { snippets: [], sources: [] };
  }
}

/**
 * Fetch market trends and trending skills for a specific role (2026 data)
 */
export async function fetchMarketTrends(goal, role) {
  if (!process.env.SERPER_API_KEY) {
    return { trendingSkills: [], emergingSkills: [], companiesHiring: [], salarySignals: [], rawSnippets: [], fallback: true, fetchedAt: new Date() };
  }

  const queries = [
    `${role} skills in demand 2026 India job market`,
    `${role} job requirements fresher hiring 2026`,
    `top companies hiring ${role} 2026 must have skills`
  ];

  try {
    const results = await Promise.all(queries.map(q => performSerperSearch(q)));
    const allSnippets = results.flat();
    const uniqueSnippets = [...new Set(allSnippets)].filter(s => s.trim().length > 15);

    const fullText = uniqueSnippets.join(' ').toLowerCase();

    // Simple frequency analysis for common tech terms (very rudimentary, Gemini handles the real analysis later)
    const commonTech = ['react', 'node.js', 'python', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'typescript', 'next.js', 'machine learning', 'ai'];
    const trendingSkills = commonTech.filter(tech => fullText.includes(tech));

    return {
      trendingSkills: trendingSkills.slice(0, 5),
      emergingSkills: [], // Gemini will extract better context from rawSnippets
      companiesHiring: [], // Gemini will extract this
      salarySignals: [], // Gemini will extract this
      rawSnippets: uniqueSnippets,
      fetchedAt: new Date()
    };
  } catch (error) {
    console.error('[Serper Market Trends Error]', error);
    return { trendingSkills: [], emergingSkills: [], companiesHiring: [], salarySignals: [], rawSnippets: [], fallback: true, fetchedAt: new Date() };
  }
}

/**
 * Fetch specific AI Career Forecaster signals (demand, salary, job postings)
 */
export async function fetchForecasterData(role) {
  if (!process.env.SERPER_API_KEY) {
    return { demandSignal: '', salarySignal: '', jobsSignal: '', rawData: [], role, generatedAt: new Date() };
  }

  const queries = [
    `${role} demand growth statistics 2026 India`,
    `${role} salary increase trend India 2026`,
    `${role} new job postings this month 2026`
  ];

  try {
    const results = await Promise.all(queries.map(q => performSerperSearch(q)));
    const allSnippets = results.flat();
    const uniqueSnippets = [...new Set(allSnippets)].filter(s => s.trim().length > 15);

    // Basic regex extractions (A smarter AI extraction would be better, but this provides fast raw signals)
    const demandSignal = uniqueSnippets.find(s => /demand|growth|increase|up|%/i.test(s))?.substring(0, 80) + "..." || "Demand is steadily growing in 2026.";
    const salarySignal = uniqueSnippets.find(s => /salary|lpa|package|ctc|₹/i.test(s))?.substring(0, 80) + "..." || "Competitive salaries offered for top talent.";
    const jobsSignal = uniqueSnippets.find(s => /jobs|postings|hiring|openings/i.test(s))?.substring(0, 80) + "..." || "Consistent hiring across major tech hubs.";

    return {
      demandSignal,
      salarySignal,
      jobsSignal,
      rawData: uniqueSnippets,
      role,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('[Serper Forecaster Error]', error);
    return { demandSignal: '', salarySignal: '', jobsSignal: '', rawData: [], role, generatedAt: new Date() };
  }
}

/**
 * Fetch person context and company news for outreach personalization (Path B fallback)
 */
export async function searchPersonContext(name, role, company) {
  if (!process.env.SERPER_API_KEY) {
    console.warn('[Serper] SERPER_API_KEY missing. Returning empty context.');
    return { personSnippets: [], companyNews: [], source: 'serper', dataFound: false };
  }

  const query1 = `"${name}" ${company} ${role} site:linkedin.com OR site:medium.com`;
  const query2 = `${company} latest news product update 2025`;

  try {
    const promises = [
      fetch(SERPER_BASE, {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query1, num: 5, gl: 'in', hl: 'en' })
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      
      fetch(SERPER_BASE, {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query2, num: 5, gl: 'in', hl: 'en', tbs: 'qdr:m3' }) // last 3 months
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    ];

    const [personRes, companyRes] = await Promise.all(promises);

    const personSnippets = [];
    if (personRes && personRes.organic) {
      personRes.organic.forEach(item => {
        if (item.snippet) personSnippets.push(item.snippet);
      });
    }

    const companyNews = [];
    if (companyRes) {
      if (companyRes.answerBox && companyRes.answerBox.snippet) {
        companyNews.push(companyRes.answerBox.snippet);
      }
      if (companyRes.organic) {
        companyRes.organic.forEach(item => {
          if (item.title) companyNews.push(item.title);
        });
      }
    }

    return {
      personSnippets,
      companyNews,
      source: 'serper',
      dataFound: personSnippets.length > 0 || companyNews.length > 0
    };
  } catch (error) {
    console.error(`[Serper] Failed to search context for ${name}:`, error.message);
    return { personSnippets: [], companyNews: [], source: 'serper', dataFound: false };
  }
}
