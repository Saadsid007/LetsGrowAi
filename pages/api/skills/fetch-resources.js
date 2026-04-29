import { getUserFromRequest } from "@/lib/auth";
import { fetchLearningResources } from "@/lib/tavily";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { skills, company } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one skill is required' });
    }

    // Limit to 20 skills max
    const limitedSkills = skills.slice(0, 20);
    const resourceMap = await fetchLearningResources(limitedSkills, company || undefined);

    return res.status(200).json({ success: true, resources: resourceMap });
  } catch (error) {
    console.error('[Fetch Resources Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
