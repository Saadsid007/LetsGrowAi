import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import SavedCompany from "@/models/SavedCompany";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { slug } = req.query;
    if (!slug) return res.status(400).json({ success: false, error: 'Missing slug parameter' });

    const deleted = await SavedCompany.findOneAndDelete({ userId: user._id, companySlug: slug });
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Saved company not found' });
    }

    return res.status(200).json({ success: true, message: 'Removed from saved companies' });

  } catch (error) {
    console.error('[Company Saved Delete API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
