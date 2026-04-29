import connectDB from '../../../../lib/db';
import { getUserFromRequest, clearAuthCookie } from '../../../../lib/auth';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    if (req.body.confirmation !== 'DELETE') {
      return res.status(400).json({ success: false, error: 'Invalid confirmation' });
    }

    await User.findByIdAndUpdate(user._id, { 
      $set: { deleted: true, deletedAt: new Date() } 
    });

    clearAuthCookie(res);

    return res.status(200).json({ success: true, message: 'Account scheduled for deletion' });
  } catch (error) {
    console.error('[Account Delete API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
