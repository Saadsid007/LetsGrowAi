import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { notifications } = req.body;
    if (notifications) {
      await User.findByIdAndUpdate(user._id, { $set: { notifications } });
    }

    return res.status(200).json({ success: true, message: 'Notifications updated' });
  } catch (error) {
    console.error('[Notifications Update API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
