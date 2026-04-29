import { getUserFromRequest } from '@/lib/auth';
import { getTemplateById } from "@/lib/roadmapTemplates";
import { personalizeTemplate } from "@/lib/gemma";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { templateId, currentLevel, userSkills = [], dailyHours, deadline } = req.body;

    if (!templateId || !currentLevel || !dailyHours || !deadline) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Use Gemma to adapt the template to the user's specific skills and timeline
    const personalizedWeeks = await personalizeTemplate(
      template, 
      currentLevel, 
      userSkills, 
      dailyHours, 
      deadline
    );

    const isPersonalized = personalizedWeeks && personalizedWeeks.length > 0 && personalizedWeeks !== template.weeks;

    return res.status(200).json({
      success: true,
      templateId,
      originalTitle: template.title,
      personalizedWeeks: isPersonalized ? personalizedWeeks : template.weeks,
      previewOnly: true,
      personalized: isPersonalized
    });

  } catch (error) {
    console.error('[Personalize Template API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
