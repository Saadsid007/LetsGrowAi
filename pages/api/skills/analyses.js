import { getUserFromRequest } from "@/lib/auth";
import mongoose from "mongoose";
import SkillAnalysis from "@/models/SkillAnalysis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const analyses = await SkillAnalysis.find({ userId: user._id })
      .select('inputType input result.gapScore result.summaryNote analyzedAt')
      .sort({ analyzedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SkillAnalysis.countDocuments({ userId: user._id });

    return res.status(200).json({
      success: true,
      analyses,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('[Get Analyses Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
