import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachMessage from '@/models/OutreachMessage';
import { scoreMessageQuality } from '@/lib/gemini';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { messageId, version } = req.query;

    if (!messageId || !version) {
      return res.status(400).json({ success: false, error: 'Missing messageId or version' });
    }

    const versionNum = parseInt(version, 10);

    const message = await OutreachMessage.findOne({ _id: messageId, userId: user._id });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found or unauthorized' });
    }

    const versionData = message.generatedVersions.find(v => v.version === versionNum);
    if (!versionData) {
      return res.status(404).json({ success: false, error: 'Version not found in message' });
    }

    const qualityScores = await scoreMessageQuality([versionData.message], message.messageType, message.senderGoal);
    
    if (!qualityScores || !qualityScores.scores || qualityScores.scores.length === 0) {
      return res.status(500).json({ success: false, error: 'Scoring failed' });
    }

    // Replace the specific version's score
    const newScore = qualityScores.scores[0];
    newScore.version = versionNum; // ensure version matches

    let existingScores = message.qualityScores || [];
    const scoreIndex = existingScores.findIndex(s => s.version === versionNum);

    if (scoreIndex >= 0) {
      existingScores[scoreIndex] = newScore;
    } else {
      existingScores.push(newScore);
    }

    await OutreachMessage.updateOne(
      { _id: messageId },
      { $set: { qualityScores: existingScores } }
    );

    return res.status(200).json({
      success: true,
      score: newScore
    });

  } catch (error) {
    console.error('[Outreach Quality API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
