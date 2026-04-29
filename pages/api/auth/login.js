import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { generateToken, setAuthCookie } from '../../../lib/auth';
import { loginSchema } from '../../../lib/validators';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // 1. Validate input
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: (result.error.issues || result.error.errors)?.[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    }

    const { email, password } = result.data;

    // 2. Connect DB
    await connectDB();

    // 3. Find user — explicitly include passwordHash (select: false by default)
    const user = await User.findOne({ email }).select('+passwordHash');

    // 4. Generic "invalid" message to prevent email enumeration attacks
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // 5. Google users cannot log in with password
    if (user.provider === 'google' && !user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google Sign-In. Please log in with Google.',
        code: 'GOOGLE_ACCOUNT',
      });
    }

    // 6. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // 7. Update lastActive timestamp (use updateOne to avoid schema conflicts on legacy docs)
    await User.updateOne({ _id: user._id }, { $set: { lastActive: new Date() } });

    // 8. Generate JWT + set cookie
    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
