import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import Roadmap from "@/models/Roadmap";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { status } = req.query;
    const filter = { userId: user._id };
    
    if (status) {
      filter.status = status;
    }

    // Exclude the heavy 'weeks.topics.resources' from the list view to improve performance
    const roadmaps = await Roadmap.find(filter)
      .select('title goal status progress totalWeeks config.targetDeadline marketInfluenced createdAt shareableSlug')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: roadmaps.length,
      roadmaps
    });

  } catch (error) {
    console.error('[Get My Roadmaps API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
