import connectDB from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import User from '../../../models/User';
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

    // 3. Build the update object
    const updateFields = { lastActive: new Date(), onboardingComplete: true };
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (currentStatus !== undefined) updateFields.currentStatus = currentStatus;
    if (targetRole !== undefined) updateFields.targetRole = targetRole;
    if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel;
    if (preferredLocation !== undefined) updateFields.preferredLocation = preferredLocation;

    // Handle skills — ensure new object format
    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        updateFields.skills = { technical: skills, soft: [] };
      } else {
        updateFields.skills = skills;
      }
    }

    // Calculate profile score inline
    let score = 0;
    const n = name || user.name; if (n) score += 10;
    score += 10; // email always exists
    if (targetRole || user.targetRole) score += 15;
    if (experienceLevel || user.experienceLevel) score += 10;
    if (preferredLocation || user.preferredLocation || user.location) score += 10;
    if (user.education?.degree) score += 10;
    if (user.bio) score += 10;
    if (user.linkedinUrl) score += 5;
    if (user.githubUrl) score += 5;
    const sk = updateFields.skills || user.skills;
    const techSkills = Array.isArray(sk) ? sk : (sk?.technical || []);
    if (techSkills.length > 0) score += 15;
    updateFields.profileScore = Math.min(score, 100);

    // 4. Use updateOne to avoid schema conflicts on legacy docs
    await User.updateOne({ _id: user._id }, { $set: updateFields });

    // Fetch updated user to return
    const updatedUser = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: 'Onboarding complete!',
      user: updatedUser.toSafeObject(),
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
