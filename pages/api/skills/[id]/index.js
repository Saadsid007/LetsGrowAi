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

    const { id } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid analysis ID' });
    }

    const analysis = await SkillAnalysis.findOne({ 
      _id: id,
      userId: user._id 
    });

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('[Get Single Analysis Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
