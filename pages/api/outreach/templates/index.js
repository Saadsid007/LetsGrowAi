import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachTemplate from '@/models/OutreachTemplate';
import OutreachMessage from '@/models/OutreachMessage';

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    if (req.method === 'GET') {
      const templates = await OutreachTemplate.find({ userId: user._id }).sort({ usageCount: -1 });
      
      const formattedTemplates = templates.map(t => {
        let variantARate = null;
        let variantBRate = null;
        
        if (t.abTest && t.abTest.isActive) {
          if (t.abTest.variantAStats.sent > 0) {
            variantARate = (t.abTest.variantAStats.replies / t.abTest.variantAStats.sent) * 100;
          }
          if (t.abTest.variantBStats.sent > 0) {
            variantBRate = (t.abTest.variantBStats.replies / t.abTest.variantBStats.sent) * 100;
          }
        }
        
        return {
          _id: t._id,
          name: t.name,
          messageType: t.messageType,
          baseMessage: t.baseMessage,
          variables: t.variables,
          usageCount: t.usageCount,
          createdAt: t.createdAt,
          abTest: {
            isActive: t.abTest ? t.abTest.isActive : false,
            variantARate,
            variantBRate
          }
        };
      });

      return res.status(200).json({ success: true, templates: formattedTemplates });

    } else if (req.method === 'POST') {
      const count = await OutreachTemplate.countDocuments({ userId: user._id });
      if (count >= 30) {
        return res.status(400).json({ success: false, error: 'Maximum template limit (30) reached' });
      }

      const { name, messageType, baseMessage, messageId } = req.body;

      if (!name || !messageType || !baseMessage) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Extract variables (words enclosed in double braces)
      const variables = [];
      const regex = /{{(.*?)}}/g;
      let match;
      while ((match = regex.exec(baseMessage)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      const newTemplate = await OutreachTemplate.create({
        userId: user._id,
        name,
        messageType,
        baseMessage,
        variables
      });

      if (messageId) {
        await OutreachMessage.updateOne(
          { _id: messageId, userId: user._id },
          { $set: { savedAsTemplate: true, templateId: newTemplate._id } }
        );
      }

      return res.status(201).json({ success: true, template: newTemplate });

    } else {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('[Outreach Templates API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
