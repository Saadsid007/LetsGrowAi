import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import { onboardingSchema } from '../../../lib/validators';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    await connectDB();

    // 1. Authenticate the request
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    // 2. Validate body
    const result = onboardingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: (result.error.issues || result.error.errors)?.[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.issues || result.error.errors,
      });
    }

    const { name, phone, currentStatus, targetRole, skills, experienceLevel, preferredLocation } = result.data;

    // 3. Update user fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (currentStatus !== undefined) user.currentStatus = currentStatus;
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (skills !== undefined) user.skills = skills;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
    if (preferredLocation !== undefined) user.preferredLocation = preferredLocation;

    // 4. Mark onboarding complete + calculate profile score
    user.onboardingComplete = true;
    user.calculateProfileScore();
    user.lastActive = new Date();

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Onboarding complete!',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('[ONBOARDING ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
