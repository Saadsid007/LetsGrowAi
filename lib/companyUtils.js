import User from '@/models/User';
import CompanyProfile from '@/models/CompanyProfile';
import { fetchCompanyData } from './exa';
import { groundedCompanyFacts, generateCompanyReport } from './gemini';

/**
 * Generate a URL-friendly slug from a company name
 */
export function generateSlug(companyName) {
  if (!companyName) return '';
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if the cache is valid (within 7 days)
 */
export function isCacheValid(lastFetchedAt) {
  if (!lastFetchedAt) return false;
  const CACHE_DAYS = 7;
  const daysSince = (Date.now() - new Date(lastFetchedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < CACHE_DAYS;
}

/**
 * Normalize company name (trim, capitalize, handle common aliases)
 */
export function normalizeCompanyName(input) {
  if (!input) return '';
  let name = input.trim();
  
  // Basic Title Case
  name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Common Aliases Mapping
  const aliases = {
    'Tcs': 'Tata Consultancy Services',
    'Tata Consultancy Services': 'Tata Consultancy Services',
    'Wipro Ltd': 'Wipro',
    'Wipro Limited': 'Wipro',
    'Faang': 'Google', // Example alias handling
    'Alphabet': 'Google',
    'Meta': 'Meta',
    'Facebook': 'Meta',
    'Amazon.com': 'Amazon',
    'Aws': 'Amazon Web Services'
  };

  return aliases[name] || name;
}

/**
 * Extract company name from a job URL (stub for future use)
 */
export function extractCompanyFromUrl(url) {
  // Add parsing logic for LinkedIn/Naukri URLs later
  return null;
}

/**
 * Log recent search to User model (keeps last 3)
 */
export async function logRecentSearch(userId, name, slug, role) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        recentCompanySearches: {
          $each: [{ companyName: name, companySlug: slug, role, searchedAt: new Date() }],
          $slice: -3,       // keep only last 3
          $position: 0      // add at front
        }
      }
    });
  } catch (error) {
    console.error('[logRecentSearch Error]', error);
  }
}

/**
 * Core reusable function to get or fetch a company report.
 * Checks cache first, fetches if missing/expired/forced.
 */
export async function getOrFetchCompanyReport(company, role, forceRefresh = false) {
  const normalizedName = normalizeCompanyName(company);
  const slug = generateSlug(normalizedName);
  const targetRole = role || 'Software Engineer';

  const cached = await CompanyProfile.findOne({ companySlug: slug });

  // CACHE HIT
  if (cached && isCacheValid(cached.lastFetchedAt) && !forceRefresh) {
    cached.searchCount += 1;
    await cached.save();

    const daysSince = Math.round((Date.now() - new Date(cached.lastFetchedAt).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      report: cached.cachedReport,
      slug,
      normalizedName,
      targetRole,
      fromCache: true,
      cacheAge: `${daysSince} days old`,
      dataFreshness: cached.dataFreshness
    };
  }

  // FRESH FETCH (Cache Miss / Expired / Forced)
  const exaData = await fetchCompanyData(normalizedName, targetRole);
  
  // If no data found at all
  if (exaData.allSources.length === 0) {
     throw new Error('COMPANY_NOT_FOUND');
  }

  const groundedFacts = await groundedCompanyFacts(normalizedName, targetRole, exaData);
  const report = await generateCompanyReport(normalizedName, targetRole, exaData, groundedFacts);

  // SAVE TO CACHE
  await CompanyProfile.findOneAndUpdate(
    { companySlug: slug },
    {
      companySlug: slug,
      companyName: normalizedName,
      cachedReport: report,
      lastFetchedAt: new Date(),
      exaSourceUrls: exaData.allSources,
      dataFreshness: report.dataFreshness,
      confidenceScore: report.confidenceScore,
      $inc: { fetchCount: 1, searchCount: 1 }
    },
    { upsert: true, returnDocument: 'after' }
  );

  return {
    report,
    slug,
    normalizedName,
    targetRole,
    fromCache: false,
    cacheAge: '0 days old',
    dataFreshness: report.dataFreshness
  };
}
