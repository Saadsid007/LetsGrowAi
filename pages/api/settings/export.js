import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import Resume from '../../../models/Resume';
import Roadmap from '../../../models/Roadmap';
import SavedCompany from '../../../models/SavedCompany';
import SkillAnalysis from '../../../models/SkillAnalysis';
import InterviewSession from '../../../models/InterviewSession';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const userId = user._id;

    const [resumes, roadmaps, savedCompanies, skillAnalyses, interviewSessions] = await Promise.all([
      Resume.find({ userId }),
      Roadmap.find({ userId }),
      SavedCompany.find({ userId }),
      SkillAnalysis.find({ userId }),
      InterviewSession.find({ userId })
    ]);

    const exportData = {
      profile: user.toSafeObject(),
      resumes,
      roadmaps,
      savedCompanies,
      skillAnalyses,
      interviewSessions,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Disposition', 'attachment; filename="letsgrowai-export.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('[Export API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
