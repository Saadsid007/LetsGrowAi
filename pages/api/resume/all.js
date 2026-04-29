import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import Resume from '../../../models/Resume';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const resumes = await Resume.find({ userId: user._id })
      .select('-atsHistory -sections.experience.originalBullets')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        resumes,
        count: resumes.length
      }
    });

  } catch (error) {
    console.error('[Get All Resumes API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
