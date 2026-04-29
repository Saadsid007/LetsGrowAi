import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import JDResumePoints from '@/models/JDResumePoints';
import { analyzeJobDescription, generateSkillsAndBullets, generateSummaryAndProjectsFallback } from '@/lib/gemini';
import { generateSummaryAndProjects } from '@/lib/cerebras';

// ─── Helper: Calculate match score (pure JS) ────────────────────────────────
function calculateMatchScore(jdSkills, userSkills) {
  if (!jdSkills || jdSkills.length === 0) return 0;
  const userLower = (userSkills || []).map(s => s.toLowerCase().trim());
  const matches = jdSkills.filter(s => userLower.includes(s.toLowerCase().trim())).length;
  return Math.round((matches / jdSkills.length) * 100);
}

// ─── Helper: Basic regex fallback for JD analysis ───────────────────────────
function basicJDAnalysis(jdText) {
  const text = jdText.toLowerCase();
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'nodejs',
    'angular', 'vue', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'sql',
    'mongodb', 'postgresql', 'redis', 'git', 'ci/cd', 'html', 'css',
    'nextjs', 'express', 'django', 'flask', 'spring', 'graphql', 'rest',
    'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'ai',
    'figma', 'jira', 'agile', 'scrum', 'linux', 'c++', 'c#', 'go', 'rust',
  ];
  const found = commonSkills.filter(s => text.includes(s));

  let seniorityLevel = 'fresher';
  if (text.includes('senior') || text.includes('lead') || text.includes('5+ years')) seniorityLevel = 'senior';
  else if (text.includes('3+ years') || text.includes('mid')) seniorityLevel = 'mid';
  else if (text.includes('1+ year') || text.includes('junior') || text.includes('1-3 years')) seniorityLevel = 'junior';

  return {
    detectedRole: 'Software Developer',
    companyType: 'unknown',
    experienceRequired: '',
    keyTechnicalSkills: found.slice(0, 15),
    toolsRequired: [],
    softSkillsMentioned: [],
    projectDomains: [],
    keyResponsibilities: [],
    niceToHaveSkills: [],
    seniorityLevel,
    focusAreas: found.slice(0, 3),
  };
}

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    // ═══════════════════════════════════════════════════════════════════════
    // GET — List all user's JD points (summary view)
    // ═══════════════════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      const points = await JDResumePoints.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .select('jdAnalysis.detectedRole result.summary status createdAt usedInResumeId')
        .lean();

      const formatted = points.map(p => ({
        _id: p._id,
        detectedRole: p.jdAnalysis?.detectedRole || 'Unknown Role',
        summaryPreview: p.result?.summary ? p.result.summary.substring(0, 100) + '...' : '',
        status: p.status,
        createdAt: p.createdAt,
        usedInResumeId: p.usedInResumeId || null,
      }));

      return res.status(200).json({ success: true, points: formatted });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST — Main generation endpoint
    // ═══════════════════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      let { jdText, jobUrl, userInfo, sectionsToGenerate } = req.body || {};

      // ─── Validation ─────────────────────────────────────────────────────
      if (!sectionsToGenerate || !Array.isArray(sectionsToGenerate) || sectionsToGenerate.length === 0) {
        return res.status(400).json({ success: false, error: 'sectionsToGenerate is required (min 1 item)' });
      }

      if (!jdText && !jobUrl) {
        return res.status(400).json({ success: false, error: 'Either jdText or jobUrl must be provided' });
      }

      // If jobUrl provided and no jdText, try to fetch it
      if (jobUrl && !jdText) {
        try {
          const baseUrl = req.headers.host?.includes('localhost')
            ? `http://${req.headers.host}`
            : `https://${req.headers.host}`;
          const fetchRes = await fetch(`${baseUrl}/api/resume/fetch-jd`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: req.headers.cookie || '',
            },
            body: JSON.stringify({ url: jobUrl }),
          });
          const fetchData = await fetchRes.json();
          if (fetchData.success && fetchData.jdText) {
            jdText = fetchData.jdText;
          }
        } catch (fetchErr) {
          console.error('[JD Points] URL fetch failed:', fetchErr.message);
        }
      }

      if (!jdText || jdText.length < 50) {
        return res.status(400).json({ success: false, error: 'JD_TOO_SHORT', message: 'Job description must be at least 50 characters' });
      }
      if (jdText.length > 5000) {
        jdText = jdText.substring(0, 5000);
      }

      // ─── Merge userInfo with user's DB profile ──────────────────────────
      const dbUser = await User.findById(user._id).select('name skills experienceLevel targetRole').lean();

      const resolvedUserInfo = {
        name: userInfo?.name || dbUser?.name || '',
        experienceLevel: userInfo?.experienceLevel || dbUser?.experienceLevel || '',
        existingSkills: (userInfo?.existingSkills && userInfo.existingSkills.length > 0)
          ? userInfo.existingSkills
          : (dbUser?.skills || []),
        yearsOfExp: userInfo?.yearsOfExp || '',
      };

      // ══════════════════════════════════════════════════════════════════════
      // STEP A — Gemini: Analyze JD
      // ══════════════════════════════════════════════════════════════════════
      let jdAnalysis;
      let analysisQuality = 'full';
      try {
        jdAnalysis = await analyzeJobDescription(jdText);
      } catch (err) {
        console.warn('[JD Points] Gemini JD analysis failed, using basic fallback:', err.message);
        jdAnalysis = basicJDAnalysis(jdText);
        analysisQuality = 'basic';
      }

      // ══════════════════════════════════════════════════════════════════════
      // STEP B + C — PARALLEL: Cerebras + Gemini
      // ══════════════════════════════════════════════════════════════════════
      const needsCerebras = sectionsToGenerate.some(s => ['summary', 'objective', 'projects'].includes(s));
      const needsGeminiGen = sectionsToGenerate.some(s => ['skills', 'bullets'].includes(s));

      let summaryAndProjectsPromise;
      if (needsCerebras) {
        summaryAndProjectsPromise = generateSummaryAndProjects(jdAnalysis, resolvedUserInfo, sectionsToGenerate)
          .catch(async (err) => {
            console.warn('[JD Points] Cerebras failed, falling back to Gemini:', err.message);
            try {
              return await generateSummaryAndProjectsFallback(jdAnalysis, resolvedUserInfo, sectionsToGenerate);
            } catch (fallbackErr) {
              console.error('[JD Points] Gemini fallback also failed:', fallbackErr.message);
              return null;
            }
          });
      } else {
        summaryAndProjectsPromise = Promise.resolve(null);
      }

      const skillsAndBulletsPromise = needsGeminiGen
        ? generateSkillsAndBullets(jdAnalysis, resolvedUserInfo, sectionsToGenerate).catch(err => {
            console.error('[JD Points] Skills generation failed:', err.message);
            return null;
          })
        : Promise.resolve(null);

      const [summaryAndProjects, skillsAndBullets] = await Promise.all([
        summaryAndProjectsPromise,
        skillsAndBulletsPromise,
      ]);

      // ══════════════════════════════════════════════════════════════════════
      // STEP D — Merge + Save
      // ══════════════════════════════════════════════════════════════════════
      const result = {
        summary: summaryAndProjects?.summary || '',
        objective: summaryAndProjects?.objective || '',
        skills: skillsAndBullets?.skills || { technical: [], tools: [], soft: [] },
        projects: summaryAndProjects?.projects || [],
        experienceBullets: skillsAndBullets?.experienceBullets || [],
      };

      const saved = await JDResumePoints.create({
        userId: user._id,
        jdText: jdText.substring(0, 4000),
        jdUrl: jobUrl || '',
        jdAnalysis,
        result,
        userInfo: resolvedUserInfo,
        sectionsGenerated: sectionsToGenerate,
        analysisQuality,
      });

      const matchScore = calculateMatchScore(
        jdAnalysis.keyTechnicalSkills,
        resolvedUserInfo.existingSkills
      );

      return res.status(200).json({
        success: true,
        savedId: saved._id,
        jdAnalysis: {
          detectedRole: jdAnalysis.detectedRole,
          companyType: jdAnalysis.companyType,
          experienceRequired: jdAnalysis.experienceRequired,
          focusAreas: jdAnalysis.focusAreas,
          keyTechnicalSkills: jdAnalysis.keyTechnicalSkills,
          seniorityLevel: jdAnalysis.seniorityLevel,
          matchScore,
        },
        result,
        analysisQuality,
        resumeBuilderLink: `/dashboard/resume?jdPointsId=${saved._id}`,
      });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[JD Points API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
