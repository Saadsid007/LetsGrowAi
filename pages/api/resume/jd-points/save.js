import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import JDResumePoints from '@/models/JDResumePoints';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { savedId, editedResult } = req.body || {};

    if (!savedId) {
      return res.status(400).json({ success: false, error: 'savedId is required' });
    }
    if (!editedResult || typeof editedResult !== 'object') {
      return res.status(400).json({ success: false, error: 'editedResult object is required' });
    }

    const doc = await JDResumePoints.findById(savedId);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    // Ownership check
    if (doc.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Merge edited fields into existing result
    if (editedResult.summary !== undefined) doc.result.summary = editedResult.summary;
    if (editedResult.objective !== undefined) doc.result.objective = editedResult.objective;
    if (editedResult.skills) doc.result.skills = { ...doc.result.skills?.toObject?.() || doc.result.skills, ...editedResult.skills };
    if (editedResult.projects) doc.result.projects = editedResult.projects;
    if (editedResult.experienceBullets) doc.result.experienceBullets = editedResult.experienceBullets;

    doc.status = 'edited';
    doc.markModified('result');
    await doc.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[JD Points Save Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
