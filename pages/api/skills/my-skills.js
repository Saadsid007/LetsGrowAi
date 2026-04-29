import { getUserFromRequest } from "@/lib/auth";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    return res.status(200).json({ success: true, skills: user.skills || [], experienceLevel: user.experienceLevel || '' });
  } catch (error) {
    console.error('[Get User Skills Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
