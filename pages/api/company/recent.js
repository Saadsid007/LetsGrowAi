import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const userDoc = await User.findById(user._id).select('recentCompanySearches');
    if (!userDoc) return res.status(404).json({ success: false, error: 'User not found' });

    return res.status(200).json({
      success: true,
      companies: userDoc.recentCompanySearches || []
    });

  } catch (error) {
    console.error('[Company Recent API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
