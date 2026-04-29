import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import Roadmap from "@/models/Roadmap";
import { fetchTopicResources } from "@/lib/tavily";

/**
 * POST /api/roadmap/[id]/fetch-resources
 * Body: { topics: string[] }  ← user selects which topics they want resources for
 *
 * On-demand: resources are NOT auto-fetched at generation time.
 * The user chooses which topics they want, then we query Tavily.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;
    const { topics } = req.body; // e.g. ["React Hooks", "TypeScript Generics"]

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide an array of topic names to fetch resources for' });
    }

    const roadmap = await Roadmap.findOne({ _id: id, userId: user._id });
    if (!roadmap) return res.status(404).json({ success: false, error: 'Roadmap not found' });

    const { learningStyle, budget } = roadmap.config;

    // Fetch resources for only the requested topics (Tavily call)
    const resourceMap = await fetchTopicResources(topics, learningStyle, budget);

    // Inject resources into matching topics in roadmap.weeks
    roadmap.weeks.forEach(week => {
      week.topics.forEach(topic => {
        if (resourceMap[topic.name] && resourceMap[topic.name].length > 0) {
          topic.resources = resourceMap[topic.name];
        }
      });
    });

    await roadmap.save();

    return res.status(200).json({
      success: true,
      resourceMap,
      message: `Resources fetched for ${topics.length} topic(s) and saved.`
    });

  } catch (error) {
    console.error('[Fetch Resources API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
