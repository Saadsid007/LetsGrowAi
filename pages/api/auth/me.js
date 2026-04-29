import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    await connectDB();

    // Extract + verify JWT, then fetch the user from DB
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    // Update lastActive
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('[ME ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
