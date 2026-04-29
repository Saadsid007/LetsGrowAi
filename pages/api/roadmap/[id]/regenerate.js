import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import Roadmap from "@/models/Roadmap";
import { regenerateRoadmap } from "@/lib/gemini";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;

    const roadmap = await Roadmap.findOne({ _id: id, userId: user._id });
    if (!roadmap) return res.status(404).json({ success: false, error: 'Roadmap not found' });

    // Enforce max regeneration limit (e.g. 5) to prevent abuse
    if (roadmap.regenerationCount >= 5) {
      return res.status(400).json({ success: false, error: 'MAX_REGENERATIONS_REACHED' });
    }

    const completedWeeks = roadmap.weeks.filter(w => w.completed);
    const remainingWeeks = roadmap.weeks.filter(w => !w.completed);

    if (remainingWeeks.length === 0) {
      return res.status(400).json({ success: false, error: 'Roadmap is already completed' });
    }

    // Calculate how many weeks delayed
    const weeksElapsed = Math.floor((Date.now() - roadmap.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const expectedCompleted = weeksElapsed;
    const weeksDelayed = Math.max(0, expectedCompleted - completedWeeks.length);

    if (weeksDelayed === 0 && roadmap.regenerationCount > 0) {
       // Optional check: Maybe they aren't behind. For now, let them regenerate anyway if they click it.
    }

    // Call Gemini to replan
    const newRemainingWeeks = await regenerateRoadmap({
      originalGoal: roadmap.goal,
      completedWeeks,
      remainingWeeks,
      weeksDelayed,
      dailyHours: roadmap.config.dailyHours,
      originalDeadline: roadmap.config.targetDeadline
    });

    // We don't fetch resources here automatically anymore. We format the new topics.
    const assembledNewWeeks = newRemainingWeeks.map(week => ({
      ...week,
      completed: false,
      topics: (week.topics || []).map(topic => ({
        ...topic,
        completed: false,
        resources: [] // To be fetched manually
      }))
    }));

    // Update the roadmap document
    roadmap.weeks = [...completedWeeks, ...assembledNewWeeks];
    roadmap.regenerationCount += 1;
    roadmap.lastRegeneratedAt = new Date();

    await roadmap.save(); // Pre-save hook recalculates progress based on the new array length

    return res.status(200).json({
      success: true,
      roadmap,
      regenerationNote: `Roadmap re-planned. ${weeksDelayed} weeks of delay accounted for.`,
      regenerationsLeft: 5 - roadmap.regenerationCount
    });

  } catch (error) {
    console.error('[Regenerate Roadmap API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
