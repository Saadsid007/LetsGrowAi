import OpenAI from 'openai';

let gemmaClient = null;

function getGemmaClient() {
  if (!gemmaClient) {
    if (!process.env.GEMMA_API_KEY) {
      console.warn('[Gemma] GEMMA_API_KEY is not set.');
    }
    gemmaClient = new OpenAI({
      apiKey: process.env.GEMMA_API_KEY || 'dummy_key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
  }
  return gemmaClient;
}

const GEMMA_MODEL = 'gemma-4-31b-it';

export async function personalizeTemplate(template, userLevel, userSkills, dailyHours, deadline) {
  if (!process.env.GEMMA_API_KEY) {
    console.warn('[Gemma] No API key. Returning original template.');
    return template.weeks;
  }

  const client = getGemmaClient();

  const prompt = `You are an expert curriculum designer. Adapt this career roadmap template for a specific user.

Template: ${template.title}
Original weeks: ${JSON.stringify(template.weeks)}

User profile:
- Current level: ${userLevel}
- Known skills: ${userSkills.join(', ')}
- Daily study time: ${dailyHours} hours
- Target deadline: ${deadline}

Adaptation rules:
- Beginner: Keep all basics, add more explanation weeks
- Intermediate: Skip fundamentals they likely know (e.g. ${userSkills.join(', ')}), start from intermediate topics
- Advanced: Skip to advanced patterns, add architecture topics

For deadline compression:
- 1 month: Only CRITICAL path topics, remove nice-to-haves
- 3 months: Standard plan, include projects
- 6 months: Full plan with extra depth + portfolio
- 1 year: Comprehensive with specialization tracks

Return ONLY the same JSON structure as the input template "Original weeks" (an array of objects), but with weeks adjusted for this user.
Do NOT change the week numbering (e.g. 1, 2, 3...) — just update topics, remove irrelevant ones, add missing ones.
Each week must have: weekNumber, title, topics (array of strings), milestone.
Return ONLY valid JSON. No markdown backticks, no explanations.`;

  try {
    const response = await client.chat.completions.create({
      model: GEMMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Clean potential markdown blocks
    const cleanedContent = content.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    const personalizedWeeks = JSON.parse(cleanedContent);
    return personalizedWeeks;
  } catch (error) {
    console.error('[Gemma Personalization Error]', error);
    return template.weeks; // Fallback to original
  }
}
