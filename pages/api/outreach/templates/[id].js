import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import OutreachTemplate from '@/models/OutreachTemplate';

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { id } = req.query;

    const template = await OutreachTemplate.findOne({ _id: id, userId: user._id });
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    if (req.method === 'PUT') {
      const { name, baseMessage, abTest } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      
      if (baseMessage) {
        updateData.baseMessage = baseMessage;
        // Re-extract variables
        const variables = [];
        const regex = /{{(.*?)}}/g;
        let match;
        while ((match = regex.exec(baseMessage)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }
        updateData.variables = variables;
      }

      if (abTest && abTest.activate) {
        if (!abTest.variantB) {
          return res.status(400).json({ success: false, error: 'Must provide variantB to activate A/B test' });
        }
        updateData.abTest = {
          isActive: true,
          variantA: baseMessage || template.baseMessage,
          variantB: abTest.variantB,
          variantAStats: { sent: 0, replies: 0 },
          variantBStats: { sent: 0, replies: 0 }
        };
      }

      const updated = await OutreachTemplate.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      return res.status(200).json({ success: true, template: updated });

    } else if (req.method === 'DELETE') {
      await OutreachTemplate.deleteOne({ _id: id });
      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('[Outreach Templates API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
