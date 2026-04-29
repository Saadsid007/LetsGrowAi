import connectDB from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import InterviewSession from '@/models/InterviewSession';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const { page = 1, limit = 10, status = 'completed' } = req.query;
    
    await connectDB();

    const query = { userId: user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // We exclude messages array to keep the payload very light for list views
    const sessions = await InterviewSession.find(query)
      .select('_id config report.overallScore report.grade completedAt totalDuration status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InterviewSession.countDocuments(query);

    return res.status(200).json({
      success: true,
      sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('[History API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
