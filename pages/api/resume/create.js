import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import Resume from '../../../models/Resume';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

    const { title = 'My Resume', templateId = 'ats-friendly' } = req.body || {};

    const newResume = new Resume({
      userId: user._id,
      title,
      templateId,
      sections: {
        personal: {
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        },
        skills: {
          technical: user.skills || [],
          soft: [],
          tools: [],
          languages: []
        }
      }
    });

    await newResume.save();

    return res.status(201).json({
      success: true,
      data: newResume
    });

  } catch (error) {
    console.error('[Create Resume API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
