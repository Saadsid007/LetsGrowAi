import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';

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

    const count = await Resume.countDocuments({ userId: user._id });
    if (count >= 10) {
      return res.status(400).json({ success: false, error: 'Maximum resumes limit (10) reached.', code: 'MAX_RESUMES_REACHED' });
    }

    const original = await validateResumeOwnership(id, user._id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Original resume not found' });
    }

    // Clone data and reset meta fields
    const clonedData = original.toObject();
    
    delete clonedData._id;
    delete clonedData.createdAt;
    delete clonedData.updatedAt;
    delete clonedData.__v;

    clonedData.title = `Copy of ${original.title}`;
    clonedData.version = 1;
    clonedData.atsHistory = [];
    clonedData.latestAtsScore = null;
    clonedData.pdfUrl = '';

    const newResume = new Resume(clonedData);
    await newResume.save();

    return res.status(201).json({
      success: true,
      data: newResume
    });

  } catch (error) {
    console.error('[Duplicate Resume API Error]', error);
    return res.status(500).json({ success: false, error: 'Duplication failed' });
  }
}
