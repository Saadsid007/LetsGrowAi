import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
}

// Service role client — server-side only, bypasses RLS
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { persistSession: false }
});

// Auto-create bucket if it doesn't exist (runs once)
let bucketReady = false;
export async function ensureBucket(bucketName = 'resumes') {
  if (bucketReady) return;
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error && (error.message?.toLowerCase().includes('not found') || error.status === 404 || error.statusCode === '404')) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      });
      if (createError) {
        console.error('[Supabase] Failed to create bucket:', createError.message);
      } else {
        console.log(`[Supabase] Created bucket "${bucketName}" ✓`);
      }
    }
    bucketReady = true;
  } catch (e) {
    console.warn('[Supabase] Bucket check failed:', e.message);
  }
}

export default supabase;
