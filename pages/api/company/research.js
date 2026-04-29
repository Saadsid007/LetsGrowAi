import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import { getOrFetchCompanyReport, logRecentSearch } from "@/lib/companyUtils";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { company, role, forceRefresh } = req.body;

    if (!company || company.length < 2) {
      return res.status(400).json({ success: false, error: 'Company name must be at least 2 characters' });
    }

    try {
      const { 
        report, 
        slug, 
        normalizedName, 
        targetRole, 
        fromCache, 
        cacheAge, 
        dataFreshness 
      } = await getOrFetchCompanyReport(company, role, forceRefresh);

      // Log recent search for this user
      await logRecentSearch(user._id, normalizedName, slug, targetRole);

      // Construct Cross Module Links
      const crossModuleLinks = {
        mockInterview: {
          url: `/interview/start`,
          prefillData: {
            company: normalizedName,
            role: targetRole,
            difficulty: report.interviewProcess?.difficulty || 'Medium',
            type: 'technical'
          },
          label: `Start Mock Interview for ${normalizedName} →`
        },
        roadmap: {
          url: `/roadmap/generate`,
          prefillData: {
            goal: `I want to work at ${normalizedName} as ${targetRole}`,
            topicsToAdd: report.aiPrepTips?.roadmapTopicsToAdd || []
          },
          label: `Add ${normalizedName} prep to Roadmap →`
        },
        coldOutreach: {
          url: `/cold-outreach`,
          prefillData: {
            company: normalizedName,
            role: targetRole,
            messageType: 'cold-email'
          },
          label: `Message HR at ${normalizedName} →`
        }
      };

      return res.status(200).json({
        success: true,
        report,
        fromCache,
        cacheAge,
        dataFreshness,
        companySlug: slug,
        crossModuleLinks
      });

    } catch (err) {
      if (err.message === 'COMPANY_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'COMPANY_NOT_FOUND', message: 'No data found for this company' });
      }
      throw err;
    }

  } catch (error) {
    console.error('[Company Research API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
