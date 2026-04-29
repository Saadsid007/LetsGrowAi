import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { skill } = req.body;
    if (!skill || typeof skill !== 'string' || skill.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Skill is required' });
    }

    const trimmed = skill.trim();

    // Handle both legacy (flat array) and new (object) format
    const currentSkills = Array.isArray(user.skills) ? user.skills : (user.skills?.technical || []);

    const exists = currentSkills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return res.status(200).json({ success: true, message: 'Skill already exists', skills: currentSkills });
    }

    // Always update using the new format
    await User.updateOne(
      { _id: user._id },
      { $set: { skills: { technical: [...currentSkills, trimmed], soft: (Array.isArray(user.skills) ? [] : (user.skills?.soft || [])) } } }
    );

    return res.status(200).json({ success: true, skills: [...currentSkills, trimmed] });
  } catch (error) {
    console.error('[Add Skill Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
