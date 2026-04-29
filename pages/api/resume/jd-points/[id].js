import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import JDResumePoints from '@/models/JDResumePoints';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });

    const doc = await JDResumePoints.findById(id).lean();

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // Ownership check (both as strings to avoid ObjectId comparison bug)
    if (doc.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('[JD Points Get By ID Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
