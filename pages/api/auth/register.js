import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { generateToken, setAuthCookie } from '../../../lib/auth';
import { registerSchema } from '../../../lib/validators';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // 1. Validate input with Zod
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = (result.error.issues || result.error.errors)?.[0];
      return res.status(400).json({
        success: false,
        error: firstError?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.issues || result.error.errors,
      });
    }

    const { name, email, password } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // 4. Create new user (pre-save hook will hash the password)
    const user = new User({
      name,
      email,
      passwordHash: password, // pre-save hook hashes this
      provider: 'local',
    });

    await user.save();

    // 5. Generate JWT
    const token = generateToken(user._id.toString());

    // 6. Set httpOnly cookie
    setAuthCookie(res, token);

    // 7. Return safe user object
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error('[REGISTER ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
