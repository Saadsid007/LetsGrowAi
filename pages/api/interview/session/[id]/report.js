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

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Session ID required', code: 'MISSING_ID' });
    }

    await connectDB();

    const session = await InterviewSession.findOne({ _id: id, userId: user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    }

    if (session.status !== 'completed' && session.status !== 'abandoned') {
      return res.status(400).json({ success: false, error: 'Interview not completed yet', code: 'SESSION_NOT_COMPLETE' });
    }

    return res.status(200).json({
      success: true,
      report: session.report,
      config: session.config,
      messages: session.messages, // Provide full Q&A history
      duration: session.totalDuration
    });

  } catch (error) {
    console.error('[Report Fetch API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
