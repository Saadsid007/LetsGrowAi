import { getUserFromRequest } from '@/lib/auth';
import connectDB from "@/lib/db";
import SavedCompany from "@/models/SavedCompany";

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    if (req.method === 'POST') {
      const { companySlug, companyName, savedRole, notes } = req.body;

      if (!companySlug) return res.status(400).json({ success: false, error: 'companySlug is required' });

      // Check max limit (20 saves)
      const count = await SavedCompany.countDocuments({ userId: user._id });
      if (count >= 20) {
        return res.status(403).json({ success: false, error: 'SAVE_LIMIT_REACHED', message: 'You can only save up to 20 companies' });
      }

      try {
        const savedDoc = await SavedCompany.create({
          userId: user._id,
          companySlug,
          companyName,
          savedRole,
          notes
        });

        return res.status(201).json({ success: true, saved: savedDoc });
      } catch (err) {
        if (err.code === 11000) { // Duplicate key error
          return res.status(409).json({ success: false, error: 'ALREADY_SAVED', message: 'Company is already saved' });
        }
        throw err;
      }
    } 
    
    else if (req.method === 'GET') {
      const savedCompanies = await SavedCompany.find({ userId: user._id }).sort({ savedAt: -1 });
      return res.status(200).json({ success: true, saved: savedCompanies });
    }

    else {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('[Company Saved API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
