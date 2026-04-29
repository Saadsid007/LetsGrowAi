import { getUserFromRequest } from "@/lib/auth";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { skill } = req.body;
    if (!skill || typeof skill !== 'string' || skill.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Skill is required' });
    }

    const trimmed = skill.trim();

    // Add skill only if not already present (case-insensitive)
    const exists = user.skills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return res.status(200).json({ success: true, message: 'Skill already exists', skills: user.skills });
    }

    user.skills.push(trimmed);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, skills: user.skills });
  } catch (error) {
    console.error('[Add Skill Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
