import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { getUserFromRequest } from "@/lib/auth";

// Vercel config
export const maxDuration = 30; // 30 seconds limit for scraping

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Auth check
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  // Supported domains check
  const supportedDomains = ['naukri.com', 'linkedin.com', 'internshala.com', 'indeed.com', 'shine.com', 'monster.com'];
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const isSupported = supportedDomains.some(sd => domain.includes(sd));
    
    if (!isSupported) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported job site',
        supported: supportedDomains 
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  let browser = null;
  try {
    // Determine path based on environment
    const isLocal = process.env.NODE_ENV === 'development';
    
    // Setup browser options based on env
    const options = isLocal
      ? {
          args: [],
          executablePath: process.platform === 'win32' 
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Local chrome path for windows
            : process.platform === 'linux' 
              ? '/usr/bin/google-chrome' 
              : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          headless: true
        }
      : {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        };

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    // Set a typical user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    // Evaluate in browser context to get JD text
    const extractedText = await page.evaluate(() => {
      let text = '';
      
      // 1. Naukri
      const naukriDesc = document.querySelector('.job-desc') || document.querySelector('[class*="description"]');
      if (naukriDesc) text = naukriDesc.innerText;

      // 2. LinkedIn
      if (!text) {
        const liDesc = document.querySelector('.description__text');
        if (liDesc) text = liDesc.innerText;
      }

      // 3. Internshala
      if (!text) {
        const intDesc = document.querySelector('.internship-details');
        if (intDesc) text = intDesc.innerText;
      }
      
      // 4. Indeed
      if (!text) {
        const indeedDesc = document.querySelector('#jobDescriptionText');
        if (indeedDesc) text = indeedDesc.innerText;
      }

      // Fallback
      if (!text) {
        const main = document.querySelector('main');
        if (main) text = main.innerText;
        else text = document.body.innerText;
      }

      return text;
    });

    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(422).json({ 
        success: false, 
        error: 'JD_TOO_SHORT', 
        message: 'Could not extract valid Job Description from URL. Site might be blocking scraping.' 
      });
    }

    // Clean up excessive whitespace
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/Apply Now|Share|Save Job/gi, '')
      .substring(0, 4000) // Keep reasonable length
      .trim();

    return res.status(200).json({
      success: true,
      jdText: cleanText,
      extractedFrom: url
    });

  } catch (error) {
    console.error('[Scraper Error]', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'SCRAPE_FAILED', 
      message: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
