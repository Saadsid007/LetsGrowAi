import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import CompanyProfile from "@/models/CompanyProfile";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { slug } = req.query;
    if (!slug) return res.status(400).json({ success: false, error: 'Missing slug parameter' });

    const cached = await CompanyProfile.findOne({ companySlug: slug });
    
    if (!cached) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Company profile not found in cache. Call /research first.' });
    }

    return res.status(200).json({
      success: true,
      report: cached.cachedReport,
      fromCache: true,
      lastFetchedAt: cached.lastFetchedAt,
      confidenceScore: cached.confidenceScore
    });

  } catch (error) {
    console.error('[Company Fetch By Slug API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
