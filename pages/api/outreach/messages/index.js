import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachMessage from '@/models/OutreachMessage';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { type, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const query = { userId: user._id };
    if (type) {
      query.messageType = type;
    }

    const total = await OutreachMessage.countDocuments(query);
    
    // We only select the fields needed for the list view
    const messages = await OutreachMessage.find(query)
      .select('recipientName recipientRole company messageType path createdAt generatedVersions qualityScores feedback')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Map messages to include bestVersion summary
    const formattedMessages = messages.map(msg => {
      let bestVersion = null;
      let highestScore = -1;

      if (msg.qualityScores && msg.qualityScores.length > 0) {
        msg.qualityScores.forEach(score => {
          if (score.overallScore > highestScore) {
            highestScore = score.overallScore;
            const version = msg.generatedVersions.find(v => v.version === score.version);
            if (version) {
              bestVersion = {
                version: version.version,
                messageSnippet: version.message.substring(0, 100) + '...',
                score: score.overallScore
              };
            }
          }
        });
      }

      // If no scores, just pick version 1
      if (!bestVersion && msg.generatedVersions && msg.generatedVersions.length > 0) {
        const v1 = msg.generatedVersions.find(v => v.version === 1) || msg.generatedVersions[0];
        bestVersion = {
          version: v1.version,
          messageSnippet: v1.message.substring(0, 100) + '...',
          score: null
        };
      }

      return {
        _id: msg._id,
        recipientName: msg.recipientName,
        recipientRole: msg.recipientRole,
        company: msg.company,
        messageType: msg.messageType,
        path: msg.path,
        createdAt: msg.createdAt,
        feedback: msg.feedback,
        bestVersion
      };
    });

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      pagination: {
        page: pageNum,
        total,
        hasMore: (pageNum * limitNum) < total
      }
    });

  } catch (error) {
    console.error('[Outreach Messages GET API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
