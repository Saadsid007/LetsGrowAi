import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Resume from '@/models/Resume';
import InterviewSession from '@/models/InterviewSession';
import SkillAnalysis from '@/models/SkillAnalysis';
import Roadmap from '@/models/Roadmap';
import SavedCompany from '@/models/SavedCompany';
import OutreachMessage from '@/models/OutreachMessage';
import { getCache, setCache } from '@/lib/cache';

// Helper: Calculate Career Score (Out of 1000)
function calculateCareerScore({ user, resume, interviews, roadmap }) {
  let score = 0;

  // 1. Profile Completeness (max 100)
  if (user) {
    if (user.targetRole) score += 30;
    if (user.experienceLevel) score += 30;
    if (user.skills) {
      const skillCount = Array.isArray(user.skills) ? user.skills.length : ((user.skills.technical?.length || 0) + (user.skills.soft?.length || 0));
      if (skillCount > 3) score += 40;
    }
  }

  // 2. Resume ATS Score (max 300)
  if (resume && resume.latestAtsScore) {
    // 100 ATS = 300 points. e.g. 80 ATS = 240 points
    score += Math.floor((resume.latestAtsScore / 100) * 300);
  }

  // 3. Interview Performance (max 300)
  if (interviews && interviews.length > 0) {
    const scoredInterviews = interviews.filter(i => i.report && i.report.overallScore);
    if (scoredInterviews.length > 0) {
      const avgScore = scoredInterviews.reduce((acc, curr) => acc + curr.report.overallScore, 0) / scoredInterviews.length;
      // Cap at 100, scale to 300
      const normalizedAvg = Math.min(Math.max(avgScore, 0), 100);
      score += Math.floor((normalizedAvg / 100) * 300);
    }
  }

  // 4. Roadmap/Skill Progress (max 300)
  if (roadmap && roadmap.progress) {
    const progress = roadmap.progress.percentComplete || 0; // assuming progress is 0-100
    score += Math.floor((progress / 100) * 300);
  }

  return Math.min(score, 1000); // Cap at 1000 just in case
}

// Helper: Generate Actionable Nudges
function generateNudges({ resume, interviews, roadmap, outreach }) {
  const nudges = [];

  // Resume Rule
  if (!resume) {
    nudges.push({
      id: 'no_resume',
      type: 'warning',
      title: 'Upload Your Resume',
      message: 'You haven\'t analyzed a resume yet. Upload one to get an ATS score.',
      actionLink: '/dashboard/resume',
      actionText: 'Go to Resume'
    });
  } else if (resume.latestAtsScore < 70) {
    nudges.push({
      id: 'low_ats',
      type: 'warning',
      title: 'Improve Your Resume',
      message: `Your recent ATS score is ${resume.latestAtsScore}/100. Review the suggestions to boost your chances.`,
      actionLink: '/dashboard/resume',
      actionText: 'Review Resume'
    });
  }

  // Roadmap Rule
  if (!roadmap) {
    nudges.push({
      id: 'no_roadmap',
      type: 'info',
      title: 'Generate a Learning Roadmap',
      message: 'Get a personalized step-by-step guide to hit your target role.',
      actionLink: '/dashboard/roadmap',
      actionText: 'Create Roadmap'
    });
  }

  // Interview Rule
  if (interviews.length === 0) {
    nudges.push({
      id: 'no_interview',
      type: 'info',
      title: 'Take a Mock Interview',
      message: 'Practice makes perfect. Try an AI mock interview for your target role.',
      actionLink: '/dashboard/interview/setup',
      actionText: 'Start Interview'
    });
  } else {
    const lastInterview = interviews[0]; // Assumes sorted desc
    if (lastInterview && lastInterview.report && lastInterview.report.overallScore < 60) {
      nudges.push({
        id: 'low_interview',
        type: 'warning',
        title: 'Review Interview Feedback',
        message: 'Your last interview score was a bit low. Review the feedback to improve.',
        actionLink: '/dashboard/interview/history',
        actionText: 'View Feedback'
      });
    }
  }

  // Outreach Rule
  if (outreach.length === 0) {
    nudges.push({
      id: 'no_outreach',
      type: 'success',
      title: 'Start Networking',
      message: 'Generate your first personalized cold outreach message to connect with recruiters.',
      actionLink: '/dashboard/outreach',
      actionText: 'Create Message'
    });
  }

  return nudges;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const userAuth = await getUserFromRequest(req);
    if (!userAuth) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const userId = userAuth._id.toString();

    // 2. Connect to DB
    await connectDB();

    // 3. Parallel Database Queries
    const [
      userDoc,
      latestResume,
      allInterviews,
      latestSkillGap,
      latestRoadmap,
      savedCompanies,
      allOutreach
    ] = await Promise.all([
      User.findById(userId).select('name targetRole experienceLevel skills currentStatus createdAt').lean(),
      Resume.findOne({ userId }).sort({ updatedAt: -1 }).select('latestAtsScore atsHistory createdAt updatedAt').lean(),
      InterviewSession.find({ userId }).sort({ createdAt: -1 }).select('report status createdAt config').lean(),
      SkillAnalysis.findOne({ userId }).sort({ createdAt: -1 }).select('missingSkills masteredSkills analyzedAt').lean(),
      Roadmap.findOne({ userId }).sort({ createdAt: -1 }).select('progress title targetRole createdAt weeks').lean(),
      SavedCompany.find({ userId }).select('companyName companySlug savedAt').lean(),
      OutreachMessage.find({ userId }).select('messageType createdAt pathDowngraded qualityScore').lean()
    ]);

    if (!userDoc) return res.status(404).json({ success: false, error: 'User not found' });

    // Format Data Object
    const rawData = {
      user: userDoc,
      resume: latestResume,
      interviews: allInterviews || [],
      skillGap: latestSkillGap,
      roadmap: latestRoadmap,
      companies: savedCompanies || [],
      outreach: allOutreach || []
    };

    // 4. Calculate Career Score & Generate Nudges
    const careerScore = calculateCareerScore(rawData);
    const nudges = generateNudges(rawData);

    // Assembly
    const dashboardData = {
      ...rawData,
      careerScore,
      nudges,
      generatedAt: new Date().toISOString()
    };

    return res.status(200).json({ success: true, fromCache: false, data: dashboardData });

  } catch (error) {
    console.error('[Dashboard Summary API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
