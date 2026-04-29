import pdfParse from 'pdf-parse';
import supabase, { ensureBucket } from '../../lib/supabase';
import { getUserFromRequest } from '../../lib/auth';
import connectDB from '../../lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Read raw PDF buffer from request stream
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const pdfBuffer = Buffer.concat(buffers);

    if (pdfBuffer.length === 0) {
      return res.status(400).json({ success: false, error: 'No file data received' });
    }

    // Extract text using pdf-parse
    const parsed = await pdfParse(pdfBuffer);

    // Upload to Supabase Storage for backup/reference
    let uploadedUrl = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const timestamp = Date.now();
      const fileName = `${user._id}/ats_upload_${timestamp}.pdf`;

      await ensureBucket('resumes');

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        uploadedUrl = urlData.publicUrl;
      } else {
        console.warn('[parse-pdf] Supabase upload failed (non-critical):', error.message);
      }
    }

    return res.status(200).json({
      success: true,
      text: parsed.text,
      pages: parsed.numpages,
      uploadedUrl
    });
  } catch (error) {
    console.error('[parse-pdf] Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process PDF file' });
  }
}
