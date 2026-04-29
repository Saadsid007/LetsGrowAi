import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership, calculateCompleteness } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';

export default async function handler(req, res) {
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

    const resume = await validateResumeOwnership(id, user._id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found or unauthorized' });
    }

    // ─── GET ─────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: resume });
    }

    // ─── PUT (Update) ────────────────────────────────────────────────────
    else if (req.method === 'PUT') {
      const { title, templateId, sections } = req.body || {};

      if (title !== undefined) resume.title = title;
      if (templateId !== undefined) resume.templateId = templateId;

      // Deep merge sections if provided
      if (sections) {
        if (sections.personal) resume.sections.personal = { ...resume.sections.personal, ...sections.personal };
        if (sections.education) resume.sections.education = sections.education;
        if (sections.experience) resume.sections.experience = sections.experience;
        if (sections.skills) resume.sections.skills = { ...resume.sections.skills, ...sections.skills };
        if (sections.projects) resume.sections.projects = sections.projects;
        if (sections.certifications) resume.sections.certifications = sections.certifications;
        if (sections.customSections) resume.sections.customSections = sections.customSections;
        if (sections.layoutOrder) resume.sections.layoutOrder = sections.layoutOrder;
      }

      resume.version += 1;
      resume.completenessScore = calculateCompleteness(resume);
      
      await resume.save();

      return res.status(200).json({ success: true, data: resume });
    }

    // ─── DELETE ──────────────────────────────────────────────────────────
    else if (req.method === 'DELETE') {
      // (Optional) Delete PDF from Cloudinary if pdfUrl exists
      
      await Resume.deleteOne({ _id: resume._id });
      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    }

    // ─── OTHER METHODS ───────────────────────────────────────────────────
    else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

  } catch (error) {
    console.error(`[Resume ID API Error - Method: ${req.method}]`, error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
