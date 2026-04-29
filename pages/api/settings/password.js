import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const userContext = await getUserFromRequest(req);
    if (!userContext) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await User.findById(userContext._id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!await user.comparePassword(currentPassword)) {
      return res.status(400).json({ success: false, error: 'WRONG_CURRENT_PASSWORD' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    user.passwordHash = newPassword; 
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('[Password Update API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
