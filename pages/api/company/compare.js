import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import { getOrFetchCompanyReport } from "@/lib/companyUtils";
import { generateCompareReport } from "@/lib/gemini";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { company1, company2, role } = req.body;

    if (!company1 || !company2 || company1.toLowerCase() === company2.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'COMPARE_SAME_COMPANY', message: 'Provide two distinct companies to compare' });
    }

    try {
      // Fetch both in parallel using the shared utility function
      const [data1, data2] = await Promise.all([
        getOrFetchCompanyReport(company1, role),
        getOrFetchCompanyReport(company2, role)
      ]);

      // Generate the verdict using Gemini
      const verdict = await generateCompareReport(data1.report, data2.report, role || 'Software Engineer');

      return res.status(200).json({
        success: true,
        company1: {
          name: data1.normalizedName,
          slug: data1.slug,
          report: data1.report
        },
        company2: {
          name: data2.normalizedName,
          slug: data2.slug,
          report: data2.report
        },
        verdict
      });

    } catch (err) {
      if (err.message === 'COMPANY_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'COMPANY_NOT_FOUND', message: 'Could not fetch data for one or both companies.' });
      }
      throw err;
    }

  } catch (error) {
    console.error('[Company Compare API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
