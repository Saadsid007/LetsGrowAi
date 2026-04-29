import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import User from '../../../../models/User';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership, resumeToPlainText } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';
import { tailorResumeForJD } from '../../../../lib/gemini';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid resume ID format' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Rate Limiting Check (5/day)
    const today = new Date().toISOString().split('T')[0];
    if (user.aiUsage?.date !== today) {
      user.aiUsage = { date: today, enhanceCount: 0, atsCount: 0, tailorCount: 0 };
    }
    
    if (user.aiUsage.tailorCount >= 5) {
      return res.status(429).json({ success: false, error: 'Daily Tailor limit reached. Try again tomorrow.' });
    }

    const { jobDescription } = req.body || {};
    if (!jobDescription || jobDescription.trim().length < 100) {
      return res.status(400).json({ success: false, error: 'Job description must be at least 100 characters' });
    }

    const resume = await validateResumeOwnership(id, user._id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Prep context
    const resumeText = resumeToPlainText(resume);
    const currentSkills = [
      ...(resume.sections.skills?.technical || []),
      ...(resume.sections.skills?.tools || [])
    ];

    // AI Call
    const suggestions = await tailorResumeForJD(resumeText, jobDescription, currentSkills);

    // Increment tracker and save User
    user.aiUsage.tailorCount += 1;
    await User.updateOne({ _id: user._id }, { $set: { aiUsage: user.aiUsage } });

    return res.status(200).json({
      success: true,
      data: { suggestions },
      aiUsed: true
    });

  } catch (error) {
    if (error.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ success: false, error: 'AI is temporarily unavailable for tailoring suggestions.' });
    }
    console.error('[Tailor API Error]', error);
    return res.status(500).json({ success: false, error: 'Tailoring failed' });
  }
}
