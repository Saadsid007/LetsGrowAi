import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import User from "@/models/User";
import SkillAnalysis from "@/models/SkillAnalysis";
import Roadmap from "@/models/Roadmap";
import { fetchMarketTrends } from "@/lib/serper";
import { generateRoadmap } from "@/lib/gemini";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const {
      goal,
      currentLevel,
      dailyHours,
      learningStyle,
      targetDeadline,
      budget,
      importSkillAnalysisId
    } = req.body;

    if (!goal || goal.length < 10) return res.status(400).json({ success: false, error: 'Goal must be at least 10 characters' });
    if (!currentLevel || !dailyHours || !learningStyle || !targetDeadline || !budget) {
      return res.status(400).json({ success: false, error: 'Missing required configuration fields' });
    }

    // 1. Get User Profile
    const userDoc = await User.findById(user._id).select('skills experienceLevel targetRole name');
    if (!userDoc) return res.status(404).json({ success: false, error: 'User not found' });
    
    const userSkills = [...(userDoc.skills || [])];

    // 2. Import Skill Gap Data (if provided)
    let importedMissingSkills = [];
    if (importSkillAnalysisId) {
      const analysis = await SkillAnalysis.findOne({ _id: importSkillAnalysisId, userId: user._id });
      if (analysis && analysis.result) {
        importedMissingSkills = [
          ...(analysis.result.highPriority?.map(s => s.skill) || []),
          ...(analysis.result.mediumPriority?.map(s => s.skill) || [])
        ];
      }
    }

    // 3. Extract Role from Goal (Simple regex: "become a/an [role]")
    let extractedRole = goal;
    const match = goal.match(/become (?:a |an )?(.+)$/i);
    if (match && match[1]) {
      extractedRole = match[1].trim();
    }

    // 4. Fetch Market Trends (Parallel with AI preparation)
    const marketTrends = await fetchMarketTrends(goal, extractedRole);

    // 5. Generate Roadmap Structure with Gemini
    const roadmapJSON = await generateRoadmap({
      goal,
      currentLevel,
      dailyHours,
      learningStyle,
      targetDeadline,
      budget,
      userSkills,
      importedMissingSkills,
      marketTrends
    });

    // Note: Per user request, we DO NOT auto-fetch Tavily resources here anymore.
    // They will be fetched on-demand by the user via /api/roadmap/[id]/fetch-resources
    const assembledWeeks = roadmapJSON.weeks.map(week => ({
      ...week,
      completed: false,
      topics: (week.topics || []).map(topic => ({
        ...topic,
        completed: false,
        resources: [] // empty until fetched manually
      }))
    }));

    const totalTopics = assembledWeeks.reduce((sum, w) => sum + w.topics.length, 0);

    // 6. Save to MongoDB
    const slug = crypto.randomUUID().slice(0, 10);
    
    const newRoadmap = new Roadmap({
      userId: user._id,
      title: roadmapJSON.title || `Roadmap: ${extractedRole}`,
      goal,
      config: {
        currentLevel,
        dailyHours,
        weeklyHours: dailyHours * 7,
        learningStyle,
        targetDeadline,
        budget,
        importedFromAnalysisId: importSkillAnalysisId || null
      },
      weeks: assembledWeeks,
      totalWeeks: roadmapJSON.totalWeeks || assembledWeeks.length,
      marketInfluenced: roadmapJSON.marketInfluenced || [],
      portfolioProjects: roadmapJSON.portfolioProjects || [],
      finalOutcome: roadmapJSON.finalOutcome || '',
      progress: {
        totalTopics,
        completedTopics: 0,
        completedWeeks: 0,
        percentComplete: 0
      },
      marketTrends: {
        trendingSkills: marketTrends.trendingSkills,
        fetchedAt: marketTrends.fetchedAt
      },
      shareableSlug: slug,
      status: 'active'
    });

    await newRoadmap.save();

    return res.status(200).json({
      success: true,
      roadmap: newRoadmap,
      marketSignal: {
        trendingSkills: marketTrends.trendingSkills,
        message: marketTrends.trendingSkills.length > 0 
          ? `Market trends applied: Added ${marketTrends.trendingSkills[0]} and others based on 2026 data.`
          : `Custom roadmap generated based on your goals.`
      }
    });

  } catch (error) {
    console.error('[Generate Roadmap API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
