import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import Roadmap from "@/models/Roadmap";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;
    
    // Support querying by either MongoDB _id or shareableSlug
    const query = id.length === 24 ? { _id: id } : { shareableSlug: id };

    const roadmap = await Roadmap.findOne(query).lean();

    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }

    // Verify ownership OR public status
    if (roadmap.userId.toString() !== user._id.toString() && !roadmap.isPublic) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.status(200).json({
      success: true,
      roadmap
    });

  } catch (error) {
    console.error('[Get Roadmap API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
