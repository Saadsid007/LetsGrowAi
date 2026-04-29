import { getUserFromRequest } from '../../lib/auth';
import connectDB from '../../lib/db';
import User from '../../models/User';
import { analyzeResumeVsJD } from '../../lib/gemini';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Rate Limiting Check (10/day)
    const today = new Date().toISOString().split('T')[0];
    if (user.aiUsage?.date !== today) {
      user.aiUsage = { date: today, enhanceCount: 0, atsCount: 0, tailorCount: 0 };
    }
    
    if (user.aiUsage.atsCount >= 10) {
      return res.status(429).json({ success: false, error: 'Daily ATS Score limit reached. Try again tomorrow.' });
    }

    const { jobDescription, resumeText } = req.body || {};
    
    if (!jobDescription || jobDescription.trim().length < 100) {
      return res.status(400).json({ success: false, error: 'Job description must be at least 100 characters' });
    }
    
    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ success: false, error: 'Resume text is missing or too short' });
    }

    // AI Call
    const report = await analyzeResumeVsJD(resumeText, jobDescription);

    // Increment tracker and save User
    user.aiUsage.atsCount += 1;
    await User.updateOne({ _id: user._id }, { $set: { aiUsage: user.aiUsage } });

    return res.status(200).json({
      success: true,
      data: {
        atsReport: report,
        savedToHistory: false
      },
      aiUsed: true
    });

  } catch (error) {
    if (error.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ success: false, error: 'AI is temporarily unavailable for text analysis.' });
    }
    console.error('[ATS Score Raw API Error]', error);
    return res.status(500).json({ success: false, error: 'ATS Scoring failed' });
  }
}
