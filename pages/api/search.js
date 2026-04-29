import connectDB from '../../lib/db';
import { getUserFromRequest } from '../../lib/auth';
import Resume from '../../models/Resume';
import Roadmap from '../../models/Roadmap';
import SavedCompany from '../../models/SavedCompany';
import SkillAnalysis from '../../models/SkillAnalysis';
import InterviewSession from '../../models/InterviewSession';

const PAGES = [
  { title: 'Resume Builder', path: '/dashboard/resume', description: 'Build and optimize your resume with ATS scoring', icon: '📄', keywords: ['resume','cv','ats','builder'] },
  { title: 'Mock Interview', path: '/dashboard/interview', description: 'Practice technical and behavioral interviews', icon: '🎤', keywords: ['interview','practice','mock','question'] },
  { title: 'Skill Gap Analyzer', path: '/dashboard/skills', description: 'Find missing skills for your target role', icon: '🔍', keywords: ['skill','gap','missing','analyze','jd'] },
  { title: 'Roadmap Generator', path: '/dashboard/roadmap', description: 'Generate personalized week-by-week learning plan', icon: '🗺️', keywords: ['roadmap','plan','learning','path'] },
  { title: 'Company Research', path: '/dashboard/company', description: 'Research companies, salaries, interview process', icon: '🏢', keywords: ['company','research','salary','culture'] },
  { title: 'Cold Outreach', path: '/dashboard/outreach', description: 'Generate personalized LinkedIn and email messages', icon: '💬', keywords: ['outreach','message','linkedin','email'] },
  { title: 'Settings', path: '/settings', icon: '⚙️', keywords: ['settings','profile','password','account'] },
  { title: 'Dashboard', path: '/dashboard', icon: '📊', keywords: ['dashboard','home','overview','score'] }
];

function searchStaticPages(q) {
  const lower = q.toLowerCase();
  return PAGES.filter(p =>
    p.title.toLowerCase().includes(lower) ||
    p.description?.toLowerCase().includes(lower) ||
    p.keywords.some(k => k.includes(lower))
  ).slice(0, 3);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let q = (req.query.q || '').trim();
    if (q.length > 50) q = q.substring(0, 50);

    if (q.length < 2) {
      return res.status(200).json({
        success: true,
        query: q,
        results: {
          pages: PAGES.slice(0, 8),
          userdata: { resumes: [], roadmaps: [], companies: [], analyses: [], sessions: [] },
          actions: []
        },
        totalFound: PAGES.length
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const userId = user._id;

    const [pages, resumes, roadmaps, companies, analyses, sessions] = await Promise.all([
      searchStaticPages(q),
      Resume.find({ userId, $or: [{ title: searchRegex }, { 'sections.summary': searchRegex }] }).select('title atsScore updatedAt').limit(2),
      Roadmap.find({ userId, $or: [{ title: searchRegex }, { goal: searchRegex }, { 'weeks.title': searchRegex }] }).select('title goal progress status').limit(2),
      SavedCompany.find({ userId, $or: [{ companyName: searchRegex }, { savedRole: searchRegex }] }).select('companyName companySlug savedRole savedAt').limit(2),
      SkillAnalysis.find({ userId, $or: [{ jobTitle: searchRegex }, { company: searchRegex }] }).select('jobTitle result.gapScore createdAt').limit(2),
      InterviewSession.find({ userId, $or: [{ interviewType: searchRegex }, { targetRole: searchRegex }] }).select('interviewType feedback.overallScore createdAt').limit(2)
    ]);

    const actions = [];
    if (q.length >= 3) {
      actions.push({ title: `Analyze ${q} skill gap`, path: `/dashboard/skills?prefill=${encodeURIComponent(q)}`, icon: '🔍' });
      actions.push({ title: `Start ${q} mock interview`, path: `/dashboard/interview?type=${encodeURIComponent(q)}`, icon: '▶' });
      actions.push({ title: `Research ${q} companies`, path: `/dashboard/company?q=${encodeURIComponent(q)}`, icon: '🏢' });
    }

    const totalFound = pages.length + resumes.length + roadmaps.length + companies.length + analyses.length + sessions.length;

    return res.status(200).json({
      success: true,
      query: q,
      results: {
        pages,
        userdata: { resumes, roadmaps, companies, analyses, sessions },
        actions
      },
      totalFound
    });

  } catch (error) {
    console.error('[Search API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
