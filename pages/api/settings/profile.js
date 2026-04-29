import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const allowedFields = ['name', 'phone', 'location', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'bio', 'targetRole', 'experienceLevel', 'skills', 'education', 'jobPreferences'];
    const update = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: update },
      { new: true, runValidators: true }
    );
    
    // Recalculate score
    const newScore = updatedUser.calculateProfileScore();
    await updatedUser.save();

    return res.status(200).json({ success: true, user: updatedUser.toSafeObject(), profileCompleteness: newScore });
  } catch (error) {
    console.error('[Profile Update API Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
