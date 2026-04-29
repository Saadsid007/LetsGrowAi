import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership, resumeToPlainText } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';
import { analyzeResumeVsJD } from '../../../../lib/gemini';

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

    // Rate Limiting Check (10/day)
    const today = new Date().toISOString().split('T')[0];
    if (user.aiUsage?.date !== today) {
      user.aiUsage = { date: today, enhanceCount: 0, atsCount: 0, tailorCount: 0 };
    }
    
    if (user.aiUsage.atsCount >= 10) {
      return res.status(429).json({ success: false, error: 'Daily ATS Score limit reached. Try again tomorrow.' });
    }

    const { jobDescription } = req.body || {};
    if (!jobDescription || jobDescription.trim().length < 100) {
      return res.status(400).json({ success: false, error: 'Job description must be at least 100 characters' });
    }

    const resume = await validateResumeOwnership(id, user._id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Prepare context for Gemini
    const resumeText = resumeToPlainText(resume);

    // AI Call
    const report = await analyzeResumeVsJD(resumeText, jobDescription);

    // Build the history record
    const record = {
      score: report.overallScore,
      jobDescription: jobDescription.substring(0, 500) + (jobDescription.length > 500 ? '...' : ''),
      breakdown: report.breakdown || {},
      missingKeywords: report.missingKeywords || [],
      presentKeywords: report.presentKeywords || [],
      suggestions: report.suggestions || [],
      analyzedAt: new Date()
    };

    // Keep history length restricted
    resume.atsHistory.push(record);
    if (resume.atsHistory.length > 10) {
      resume.atsHistory = resume.atsHistory.slice(-10);
    }
    
    resume.latestAtsScore = report.overallScore;

    await resume.save();

    // Increment tracker and save User
    user.aiUsage.atsCount += 1;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      data: {
        atsReport: report,
        savedToHistory: true
      },
      aiUsed: true
    });

  } catch (error) {
    if (error.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ success: false, error: 'AI is temporarily unavailable for text analysis.' });
    }
    console.error('[ATS Score API Error]', error);
    return res.status(500).json({ success: false, error: 'ATS Scoring failed' });
  }
}
