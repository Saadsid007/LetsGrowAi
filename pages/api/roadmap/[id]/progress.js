import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import Roadmap from "@/models/Roadmap";

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;
    const { weekNumber, topicName, markWeekComplete } = req.body;

    if (!weekNumber) return res.status(400).json({ success: false, error: 'weekNumber is required' });

    const roadmap = await Roadmap.findOne({ _id: id, userId: user._id });
    if (!roadmap) return res.status(404).json({ success: false, error: 'Roadmap not found' });

    const week = roadmap.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) return res.status(404).json({ success: false, error: 'Week not found' });

    if (topicName) {
      // Toggle specific topic
      const topic = week.topics.find(t => t.name === topicName);
      if (topic) {
        topic.completed = !topic.completed;
        topic.completedAt = topic.completed ? new Date() : null;
      }
    } else if (markWeekComplete) {
      // Mark entire week (all topics) complete
      week.topics.forEach(t => {
        t.completed = true;
        t.completedAt = new Date();
      });
      week.completed = true;
      week.completedAt = new Date();
    }

    // Update streak logic
    const today = new Date();
    const todayString = today.toDateString();
    
    // Add 1 day to last activity to check if streak continues
    const lastActivity = roadmap.progress.lastActivityAt;
    if (lastActivity) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActivity.toDateString() === yesterday.toDateString()) {
        roadmap.progress.currentStreak += 1;
      } else if (lastActivity.toDateString() !== todayString) {
        roadmap.progress.currentStreak = 1; // reset streak
      }
    } else {
      roadmap.progress.currentStreak = 1;
    }
    
    roadmap.progress.lastActivityAt = today;

    // The pre-save hook will automatically recalculate percentComplete and total totals
    await roadmap.save();

    return res.status(200).json({
      success: true,
      progress: roadmap.progress,
      weekStatus: {
        weekNumber: week.weekNumber,
        completed: week.completed,
        topicsLeft: week.topics.filter(t => !t.completed).length
      }
    });

  } catch (error) {
    console.error('[Progress API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
