import { getUserFromRequest } from '@/lib/auth';
import { fetchForecasterData } from "@/lib/serper";

// Simple in-memory cache: Map<role, { data, cachedAt }>
const forecasterCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { role } = req.query;
    if (!role) return res.status(400).json({ success: false, error: 'Role parameter is required' });

    const normalizedRole = role.trim().toLowerCase();
    
    // Check cache
    const cached = forecasterCache.get(normalizedRole);
    if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
      return res.status(200).json({
        success: true,
        forecaster: { ...cached.data, source: 'cached' }
      });
    }

    // Fetch fresh data
    const forecasterData = await fetchForecasterData(role);
    
    // Cache the result
    if (!forecasterData.fallback) {
      forecasterCache.set(normalizedRole, {
        data: forecasterData,
        cachedAt: Date.now()
      });
    }

    return res.status(200).json({
      success: true,
      forecaster: { ...forecasterData, source: 'live' }
    });

  } catch (error) {
    console.error('[Forecaster API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
