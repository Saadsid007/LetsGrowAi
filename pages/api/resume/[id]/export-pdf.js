import connectDB from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';
import Resume from '../../../../models/Resume';
import { validateResumeOwnership } from '../../../../lib/resumeUtils';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import supabase, { ensureBucket } from '../../../../lib/supabase';

// Extended timeout for Chromium PDF generation
export const config = {
  api: { maxDuration: 30 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid resume ID format' });
  }

  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { templateId = 'ats-friendly' } = req.body || {};

    const resume = await validateResumeOwnership(id, user._id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ success: false, error: 'PDF storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env' });
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Build Themed HTML
    // ═══════════════════════════════════════════════════════════════════
    const theme = templateId || resume.templateId || 'ats-friendly';
    const personal = resume.sections.personal || {};
    const layoutOrder = resume.sections.layoutOrder || ['personal', 'experience', 'education', 'skills', 'projects', 'certifications'];

    const styles = {
      'clean': `
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #2b2b2b; margin: 40px; font-size: 11pt; }
        .header { text-align: center; margin-bottom: 30px; }
        .name { font-size: 24pt; font-weight: 300; letter-spacing: 1px; color: #000; margin-bottom: 5px; }
        .contact { font-size: 9pt; color: #666; margin-bottom: 20px; }
        .section-title { font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px; margin-bottom: 12px; color: #000; }
        .item { margin-bottom: 15px; }
        .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; }
        .item-sub { font-style: italic; color: #444; font-size: 10pt; margin-bottom: 4px; }
        .bullets { margin: 5px 0 0 18px; padding: 0; font-size: 10pt; color: #333; }
        .bullets li { margin-bottom: 3px; }
      `,
      'modern': `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
        .container { padding: 40px; }
        .header { background: #f8fafc; border-bottom: 4px solid #2563eb; padding: 40px; text-align: left; }
        .name { font-size: 28pt; font-weight: 800; color: #1e3a8a; margin: 0; }
        .contact { font-size: 10pt; color: #2563eb; font-weight: 500; margin-top: 10px; }
        .content { padding: 0 40px 40px 40px; }
        .section-title { font-size: 12pt; font-weight: 700; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 30px; margin-bottom: 15px; }
        .item { margin-bottom: 20px; }
        .item-header { display: flex; justify-content: space-between; font-weight: 700; color: #0f172a; }
        .item-sub { color: #2563eb; font-weight: 600; font-size: 10pt; margin-bottom: 6px; }
        .bullets { margin: 8px 0 0 20px; padding: 0; font-size: 10pt; color: #334155; }
        .bullets li { margin-bottom: 5px; }
      `,
      'ats-friendly': `
        body { font-family: 'Times New Roman', serif; color: #000; margin: 0.5in; font-size: 11pt; line-height: 1.2; }
        .header { text-align: center; margin-bottom: 15px; }
        .name { font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .contact { font-size: 10pt; margin-bottom: 10px; }
        .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 15px; margin-bottom: 8px; }
        .item { margin-bottom: 10px; }
        .item-header { display: flex; justify-content: space-between; font-weight: bold; }
        .item-sub { font-style: italic; margin-bottom: 2px; }
        .bullets { margin: 4px 0 0 25px; padding: 0; list-style-type: disc; }
        .bullets li { margin-bottom: 2px; }
      `
    };

    const currentStyle = styles[theme] || styles['ats-friendly'];

    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${resume.title}</title>
      <style>
        ${currentStyle}
        * { box-sizing: border-box; }
        .flex-row { display: flex; justify-content: space-between; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="${theme === 'modern' ? '' : 'container'}">
        <div class="header">
          <div class="name">${personal.fullName || 'Full Name'}</div>
          <div class="contact">
            ${personal.email || ''} ${personal.phone ? ' • ' + personal.phone : ''} 
            ${personal.location ? ' • ' + personal.location : ''}
            ${personal.linkedin ? ' • ' + personal.linkedin : ''}
          </div>
        </div>

        <div class="content">
          ${personal.summary ? `
            <div class="section">
              <div class="section-title">Summary</div>
              <p style="font-size: 10pt; color: #333; text-align: justify;">${personal.summary}</p>
            </div>
          ` : ''}

          ${layoutOrder.map(sectionKey => {
            if (sectionKey === 'personal') return '';
            
            const sectionData = resume.sections[sectionKey];
            if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) return '';

            let sectionHtml = `<div class="section-title">${sectionKey.replace(/([A-Z])/g, ' $1').trim()}</div>`;

            if (sectionKey === 'experience') {
              sectionData.forEach(exp => {
                sectionHtml += `
                  <div class="item">
                    <div class="item-header">
                      <span>${exp.company || ''}</span>
                      <span>${exp.startDate || ''} ${exp.endDate ? ' - ' + exp.endDate : (exp.startDate ? ' - Present' : '')}</span>
                    </div>
                    <div class="item-sub">${exp.role || ''}${exp.location ? ' | ' + exp.location : ''}</div>
                    ${exp.bullets && exp.bullets.length > 0 ? `
                      <ul class="bullets">
                        ${exp.bullets.filter(b => b.trim()).map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>`;
              });
            } else if (sectionKey === 'education') {
              sectionData.forEach(edu => {
                sectionHtml += `
                  <div class="item">
                    <div class="item-header">
                      <span>${edu.institution || ''}</span>
                      <span>${edu.endDate || ''}</span>
                    </div>
                    <div class="item-sub">${edu.degree || ''} ${edu.field ? 'in ' + edu.field : ''}</div>
                    ${edu.grade ? `<div style="font-size: 9pt;">GPA: ${edu.grade}</div>` : ''}
                  </div>`;
              });
            } else if (sectionKey === 'skills') {
              sectionHtml += `<div style="font-size: 10pt; line-height: 1.6;">`;
              if (sectionData.technical?.length > 0) sectionHtml += `<strong>Technical:</strong> ${sectionData.technical.join(', ')}<br/>`;
              if (sectionData.tools?.length > 0) sectionHtml += `<strong>Tools:</strong> ${sectionData.tools.join(', ')}<br/>`;
              if (sectionData.languages?.length > 0) sectionHtml += `<strong>Languages:</strong> ${sectionData.languages.join(', ')}<br/>`;
              if (sectionData.soft?.length > 0) sectionHtml += `<strong>Soft Skills:</strong> ${sectionData.soft.join(', ')}`;
              sectionHtml += `</div>`;
            } else if (sectionKey === 'projects') {
              sectionData.forEach(proj => {
                sectionHtml += `
                  <div class="item">
                    <div class="item-header">
                      <span>${proj.title || ''}</span>
                      <span style="font-weight: normal; font-size: 9pt;">${proj.techStack ? proj.techStack.join(', ') : ''}</span>
                    </div>
                    ${proj.bullets && proj.bullets.length > 0 ? `
                      <ul class="bullets">
                        ${proj.bullets.filter(b => b.trim()).map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : (proj.description ? `<p style="font-size: 10pt; margin-top: 4px;">${proj.description}</p>` : '')}
                  </div>`;
              });
            } else if (sectionKey === 'certifications') {
              sectionData.forEach(cert => {
                sectionHtml += `
                  <div class="item" style="margin-bottom: 5px;">
                    <div class="item-header">
                      <span>${cert.name || ''} — <span style="font-weight: normal; font-style: italic;">${cert.issuer || ''}</span></span>
                      <span>${cert.issueDate || ''}</span>
                    </div>
                  </div>`;
              });
            }
            return sectionHtml;
          }).join('')}
        </div>
      </div>
    </body>
    </html>`;

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Generate PDF via Puppeteer
    // ═══════════════════════════════════════════════════════════════════
    let browser;
    try {
      const executablePath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath || undefined,
        headless: chromium.headless
      });
    } catch (launchError) {
      console.warn('[PDF] Sparticuz fallback →', launchError.message);
      
      const fs = require('fs');
      const localPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ];

      let localPath;
      for (const p of localPaths) {
        if (fs.existsSync(p)) { localPath = p; break; }
      }

      if (!localPath) {
        throw new Error('No local browser found for PDF generation. Install Chrome or Edge.');
      }

      browser = await puppeteer.launch({
        executablePath: localPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
      });
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Upload PDF to Supabase Storage
    // ═══════════════════════════════════════════════════════════════════
    const fileName = `${user._id}/${resume._id}_v${resume.version}.pdf`;
    const bucketName = 'resumes';

    // Auto-create bucket if it doesn't exist
    await ensureBucket(bucketName);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true  // overwrite if same version exists
      });

    if (error) {
      console.error('[Supabase Upload Error]', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Save URL to MongoDB
    resume.pdfUrl = pdfUrl;
    await resume.save();

    return res.status(200).json({
      success: true,
      data: { pdfUrl }
    });

  } catch (error) {
    console.error('[Export PDF API Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'PDF generation failed' });
  }
}
