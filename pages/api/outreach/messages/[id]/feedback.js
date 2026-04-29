import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachMessage from '@/models/OutreachMessage';
import OutreachTemplate from '@/models/OutreachTemplate';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;
    const { gotReply, userRating } = req.body;

    if (gotReply === undefined && userRating === undefined) {
      return res.status(400).json({ success: false, error: 'No feedback provided' });
    }

    const message = await OutreachMessage.findOne({ _id: id, userId: user._id });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const updateFields = {};
    if (gotReply !== undefined) {
      updateFields['feedback.gotReply'] = gotReply;
      if (gotReply) {
        updateFields['feedback.repliedAt'] = new Date();
      }
    }
    if (userRating !== undefined) {
      updateFields['feedback.userRating'] = userRating;
    }

    await OutreachMessage.updateOne({ _id: id }, { $set: updateFields });

    // Update template A/B stats if linked
    if (message.savedAsTemplate && message.templateId && gotReply) {
      // Find the template
      const template = await OutreachTemplate.findById(message.templateId);
      
      if (template && template.abTest && template.abTest.isActive) {
        // Did they use variant A or B?
        // Since baseMessage is Variant A, if this message matches variant B exactly, we could track it.
        // For simplicity, let's assume if it's an A/B test, we record the reply to variant A unless tracked differently.
        // Actually, we should track which variant was sent, but the user requested:
        // "If template linked -> update template reply stats: if gotReply {$inc: {'abTest.variantAStats.replies': 1}}"
        
        const update = {
          $inc: { 'abTest.variantAStats.replies': 1 }
        };
        // Note: usageCount shouldn't increment on reply, it increments on sending.
        // We'll calculate replyRate dynamically on GET, or we can update it here.
        
        await OutreachTemplate.updateOne({ _id: message.templateId }, update);
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Outreach Feedback API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
