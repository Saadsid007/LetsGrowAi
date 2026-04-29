import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';
import {
  enhanceBulletPoints,
  generateProfessionalSummary,
  rewriteProjectDescription
} from '../../../../lib/cerebras';

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

    // Rate Limiting Check (15/day)
    const today = new Date().toISOString().split('T')[0];
    if (user.aiUsage?.date !== today) {
      user.aiUsage = { date: today, enhanceCount: 0, atsCount: 0, tailorCount: 0 };
    }
    
    if (user.aiUsage.enhanceCount >= 15) {
      return res.status(429).json({ success: false, error: 'Daily Enhance limit reached. Try again tomorrow.' });
    }

    const resume = await validateResumeOwnership(id, user._id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const { type, experienceIndex, projectIndex } = req.body || {};
    let result = {};

    if (type === 'bullets') {
      if (experienceIndex === undefined || !resume.sections.experience[experienceIndex]) {
        return res.status(400).json({ success: false, error: 'Invalid experience index' });
      }

      const exp = resume.sections.experience[experienceIndex];
      if (!exp.bullets || exp.bullets.length === 0) {
        return res.status(400).json({ success: false, error: 'No bullets to enhance' });
      }

      // Keep originals if this is the first time enhancing
      if (!exp.aiEnhanced || exp.originalBullets.length === 0) {
        exp.originalBullets = [...exp.bullets];
      }

      const enhanced = await enhanceBulletPoints(exp.bullets, exp.role, exp.company);
      exp.bullets = enhanced;
      exp.aiEnhanced = true;
      resume.markModified('sections.experience');
      
      result = { enhanced, originalKept: exp.originalBullets };

    } else if (type === 'summary') {
      const name = resume.sections.personal?.fullName || user.name;
      const targetRole = user.targetRole || 'Professional';
      const experienceLevel = user.experienceLevel || '';
      
      const skillsConcat = [
        ...(resume.sections.skills?.technical || []),
        ...(resume.sections.skills?.tools || [])
      ];

      // Grab some highlights from the first experience if exists
      let highlights = [];
      if (resume.sections.experience && resume.sections.experience.length > 0) {
        const topExp = resume.sections.experience[0];
        if (topExp.bullets && topExp.bullets.length > 0) {
          highlights = topExp.bullets.slice(0, 3);
        }
      }

      const summary = await generateProfessionalSummary(name, targetRole, skillsConcat, experienceLevel, highlights);
      
      if (!resume.sections.personal) resume.sections.personal = {};
      resume.sections.personal.summary = summary;
      resume.markModified('sections.personal');

      result = { summary };

    } else if (type === 'project') {
      if (projectIndex === undefined || !resume.sections.projects[projectIndex]) {
        return res.status(400).json({ success: false, error: 'Invalid project index' });
      }

      const proj = resume.sections.projects[projectIndex];
      if (!proj.description) {
        return res.status(400).json({ success: false, error: 'No description to rewrite' });
      }

      const bullets = await rewriteProjectDescription(proj.title, proj.description, proj.techStack || []);
      
      // Store original description separately so it isn't lost
      if (!proj.originalDescription) proj.originalDescription = proj.description;
      proj.bullets = bullets;
      proj.description = ''; // Convert paragraph to bullets
      resume.markModified('sections.projects');

      result = { bullets };

    } else {
      return res.status(400).json({ success: false, error: 'Invalid enhancement type' });
    }

    // Save Resume
    await resume.save();

    // Increment tracker and save User
    user.aiUsage.enhanceCount += 1;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, data: result, aiUsed: true });

  } catch (error) {
    if (error.message === 'AI_UNAVAILABLE') {
      return res.status(200).json({ // Return 200 but flag failure gracefully
        success: true,
        warning: 'AI temporarily unavailable. Content kept unchanged.',
        aiUsed: false
      });
    }
    console.error('[Enhance API Error]', error);
    return res.status(500).json({ success: false, error: 'Enhancement failed' });
  }
}
