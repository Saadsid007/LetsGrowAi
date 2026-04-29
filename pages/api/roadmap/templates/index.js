import { getAllTemplates } from "@/lib/roadmapTemplates";

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const templates = getAllTemplates();
    
    // Omit the full 'weeks' array for the list view to reduce payload size
    const summaryTemplates = templates.map(t => ({
      id: t.id,
      title: t.title,
      role: t.role,
      defaultDuration: t.defaultDuration,
      difficulty: t.difficulty,
      tags: t.tags,
      coreSkills: t.coreSkills
    }));

    return res.status(200).json({
      success: true,
      templates: summaryTemplates
    });
  } catch (error) {
    console.error('[Templates API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
