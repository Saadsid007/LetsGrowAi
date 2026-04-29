import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import JDResumePoints from '@/models/JDResumePoints';
import { generateSkillsAndBullets, generateSummaryAndProjectsFallback } from '@/lib/gemini';
import { generateSummaryAndProjects } from '@/lib/cerebras';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { savedId, section } = req.body || {};

    if (!savedId || !section) {
      return res.status(400).json({ success: false, error: 'savedId and section are required' });
    }

    const validSections = ['summary', 'objective', 'skills', 'project0', 'project1', 'project2', 'bullets'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ success: false, error: `Invalid section. Must be one of: ${validSections.join(', ')}` });
    }

    const doc = await JDResumePoints.findById(savedId);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    // Ownership check
    if (doc.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const jdAnalysis = doc.jdAnalysis;
    const userInfo = doc.userInfo;
    let updatedContent = null;

    // ─── Regenerate Summary or Objective via Cerebras (fallback: Gemini) ─
    if (section === 'summary' || section === 'objective') {
      try {
        const result = await generateSummaryAndProjects(jdAnalysis, userInfo, [section]);
        if (section === 'summary') {
          doc.result.summary = result.summary || doc.result.summary;
          updatedContent = doc.result.summary;
        } else {
          doc.result.objective = result.objective || doc.result.objective;
          updatedContent = doc.result.objective;
        }
      } catch (err) {
        console.warn('[Regenerate] Cerebras failed for', section, '— trying Gemini fallback');
        try {
          const fallback = await generateSummaryAndProjectsFallback(jdAnalysis, userInfo, [section]);
          if (section === 'summary') {
            doc.result.summary = fallback.summary || doc.result.summary;
            updatedContent = doc.result.summary;
          } else {
            doc.result.objective = fallback.objective || doc.result.objective;
            updatedContent = doc.result.objective;
          }
        } catch (fallbackErr) {
          return res.status(503).json({ success: false, error: 'AI_UNAVAILABLE', retry: true });
        }
      }
    }

    // ─── Regenerate Skills via Gemini ────────────────────────────────────
    else if (section === 'skills') {
      try {
        const result = await generateSkillsAndBullets(jdAnalysis, userInfo, ['skills']);
        doc.result.skills = result.skills || doc.result.skills;
        updatedContent = doc.result.skills;
      } catch (err) {
        return res.status(503).json({ success: false, error: 'AI_UNAVAILABLE', retry: true });
      }
    }

    // ─── Regenerate Experience Bullets via Gemini ────────────────────────
    else if (section === 'bullets') {
      try {
        const result = await generateSkillsAndBullets(jdAnalysis, userInfo, ['bullets']);
        doc.result.experienceBullets = result.experienceBullets || doc.result.experienceBullets;
        updatedContent = doc.result.experienceBullets;
      } catch (err) {
        return res.status(503).json({ success: false, error: 'AI_UNAVAILABLE', retry: true });
      }
    }

    // ─── Regenerate Single Project via Cerebras ─────────────────────────
    else if (section.startsWith('project')) {
      const index = parseInt(section.replace('project', ''), 10);
      if (isNaN(index) || index < 0 || index > 2) {
        return res.status(400).json({ success: false, error: 'Invalid project index (0-2)' });
      }

      try {
        const result = await generateSummaryAndProjects(jdAnalysis, userInfo, ['projects']);
        if (result.projects && result.projects[0]) {
          // Replace just the one project at the given index
          doc.result.projects[index] = result.projects[0];
          updatedContent = doc.result.projects[index];
        }
      } catch (err) {
        console.warn('[Regenerate] Cerebras failed for project — trying Gemini fallback');
        try {
          const fallback = await generateSummaryAndProjectsFallback(jdAnalysis, userInfo, ['projects']);
          if (fallback.projects && fallback.projects[0]) {
            doc.result.projects[index] = fallback.projects[0];
            updatedContent = doc.result.projects[index];
          }
        } catch (fallbackErr) {
          return res.status(503).json({
            success: false,
            error: 'AI_UNAVAILABLE',
            retry: true,
            message: 'Project regeneration failed. Existing project kept.',
          });
        }
      }
    }

    doc.markModified('result');
    await doc.save();

    return res.status(200).json({
      success: true,
      updatedSection: section,
      newContent: updatedContent,
    });
  } catch (error) {
    console.error('[JD Points Regenerate Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
