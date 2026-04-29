import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'url is required' });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, error: 'Only HTTP/HTTPS URLs are supported' });
    }

    // ─── Strategy 1: Simple fetch with HTML parsing ─────────────────────
    // Works for most job boards that render server-side (LinkedIn, Naukri, etc.)
    let jdText = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      jdText = extractTextFromHTML(html);
    } catch (fetchErr) {
      console.warn('[fetch-jd] Simple fetch failed:', fetchErr.message);

      // ─── Strategy 2: Puppeteer for JS-rendered pages ────────────────
      try {
        jdText = await scrapeWithPuppeteer(url);
      } catch (puppeteerErr) {
        console.error('[fetch-jd] Puppeteer also failed:', puppeteerErr.message);
        return res.status(422).json({
          success: false,
          error: 'SCRAPE_FAILED',
          message: 'Could not extract job description from this URL. Please paste the JD text directly.',
        });
      }
    }

    // Clean and validate extracted text
    jdText = jdText.trim();

    if (!jdText || jdText.length < 50) {
      return res.status(422).json({
        success: false,
        error: 'JD_TOO_SHORT',
        message: 'Extracted text is too short. The page may require login or the JD is behind a paywall. Please paste the JD text directly.',
      });
    }

    // Truncate to 5000 chars
    if (jdText.length > 5000) {
      jdText = jdText.substring(0, 5000);
    }

    return res.status(200).json({
      success: true,
      jdText,
      sourceUrl: url,
      extractedLength: jdText.length,
    });
  } catch (error) {
    console.error('[fetch-jd API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ─── HTML Text Extraction (no external deps) ──────────────────────────────────
function extractTextFromHTML(html) {
  // Remove script and style tags
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Try to find job description specific containers first
  const jdPatterns = [
    /<div[^>]*class="[^"]*job[-_]?desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*job[-_]?detail[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*id="[^"]*job[-_]?desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*posting[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of jdPatterns) {
    const match = clean.match(pattern);
    if (match && match[1] && match[1].length > 100) {
      clean = match[1];
      break;
    }
  }

  // Strip remaining HTML tags
  clean = clean
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|h[1-6]|tr|td|th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return clean;
}

// ─── Puppeteer Scraper (for JS-rendered pages) ────────────────────────────────
async function scrapeWithPuppeteer(url) {
  let browser = null;

  try {
    const puppeteer = await import('puppeteer-core');

    // Try common Chrome paths on Windows
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.CHROME_PATH || '',
    ].filter(Boolean);

    let executablePath = '';
    const fs = await import('fs');
    for (const p of possiblePaths) {
      try {
        await fs.promises.access(p);
        executablePath = p;
        break;
      } catch { /* try next */ }
    }

    if (!executablePath) {
      throw new Error('Chrome executable not found');
    }

    browser = await puppeteer.default.launch({
      headless: 'new',
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    // Wait a moment for JS rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract text from the page
    const text = await page.evaluate(() => {
      // Try specific selectors first
      const selectors = [
        '[class*="job-desc"]', '[class*="jobDesc"]', '[class*="description"]',
        '[id*="job-desc"]', '[id*="jobDesc"]',
        'article', '[class*="posting"]', '[class*="detail"]',
        'main',
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText && el.innerText.length > 100) {
          return el.innerText;
        }
      }

      // Fallback: body text
      return document.body?.innerText || '';
    });

    return text;
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}
