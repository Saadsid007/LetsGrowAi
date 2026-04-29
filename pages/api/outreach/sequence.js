import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachMessage from '@/models/OutreachMessage';
import { generateFollowUpSequence } from '@/lib/cerebras';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { messageId, selectedVersion } = req.body;

    if (!messageId || !selectedVersion) {
      return res.status(400).json({ success: false, error: 'Missing messageId or selectedVersion' });
    }

    const message = await OutreachMessage.findOne({ _id: messageId, userId: user._id });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found or unauthorized' });
    }

    const original = message.generatedVersions.find(v => v.version === selectedVersion);
    if (!original) {
      return res.status(400).json({ success: false, error: 'Selected version not found in message' });
    }

    const sequenceData = await generateFollowUpSequence(
      original.message,
      message.recipientName,
      message.recipientRole,
      message.company,
      message.senderGoal,
      message.messageType
    );

    // Save sequence to message and mark the selected version
    await OutreachMessage.updateOne(
      { _id: messageId, "generatedVersions.version": selectedVersion },
      { 
        $set: { 
          followUpSequence: sequenceData.sequence,
          "generatedVersions.$.selected": true
        } 
      }
    );

    return res.status(200).json({
      success: true,
      sequence: sequenceData.sequence,
      sequenceStrategy: sequenceData.sequenceStrategy,
      messageId
    });

  } catch (error) {
    console.error('[Outreach Sequence API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
