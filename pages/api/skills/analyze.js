import { getUserFromRequest } from "@/lib/auth";
import mongoose from "mongoose";
import User from "@/models/User";
import SkillAnalysis from "@/models/SkillAnalysis";
import formidable from "formidable";
import fs from "fs";

import { searchJobRequirements, searchCompanyRoleRequirements } from "@/lib/serper";
import { extractTextFromPDF } from "@/lib/pdfParser";
import { mergeGapResults } from "@/lib/skillMerger";
import { 
  cleanAndStructureJD, 
  buildCompanySkillProfile, 
  analyzeSkillGap_Gemini, 
  extractSkillsFromResumeText 
} from "@/lib/gemini";
import { analyzeSkillGap_Cerebras } from "@/lib/cerebras";

export const config = {
  api: {
    bodyParser: false, // We handle parsing manually to support multipart/form-data
  },
};

const parseReq = (req) => new Promise((resolve, reject) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve({ fields: body ? JSON.parse(body) : {}, files: {} }); }
      catch(e) { reject(e); }
    });
  } else {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      // flatten arrays from formidable
      const flatFields = {};
      for (const key in fields) flatFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      const flatFiles = {};
      for (const key in files) flatFiles[key] = Array.isArray(files[key]) ? files[key][0] : files[key];
      resolve({ fields: flatFields, files: flatFiles });
    });
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { fields, files } = await parseReq(req);
    const { inputType } = fields;

    if (!['paste-jd', 'job-title', 'company-role', 'resume-upload'].includes(inputType)) {
      return res.status(400).json({ success: false, error: 'Invalid inputType' });
    }

    // STEP A: Get User's Current Skills
    const userDoc = await User.findById(user._id).select('skills experienceLevel');
    if (!userDoc) return res.status(404).json({ success: false, error: 'User not found' });
    
    let userSkills = userDoc.skills || []; // User schema has skills as array of strings

    // Variables to hold extracted JD info
    let requiredSkills = [];
    let cleanedJDSummary = '';
    let companyInsights = null;

    // STEP B: Handle Inputs based on Tab
    if (inputType === 'paste-jd') {
      const { jdText } = fields;
      if (!jdText || jdText.length < 100) return res.status(400).json({ success: false, error: 'JD_TOO_SHORT' });
      
      const structuredJD = await cleanAndStructureJD([jdText], 'General Role', userDoc.experienceLevel || 'intermediate');
      requiredSkills = structuredJD.allSkillsCombined || structuredJD.requiredSkills || [];
      cleanedJDSummary = structuredJD.cleanedJDSummary;
    } 
    
    else if (inputType === 'job-title') {
      const { jobTitle, experienceLevel } = fields;
      if (!jobTitle) return res.status(400).json({ success: false, error: 'Job title required' });
      
      let snippets = await searchJobRequirements(jobTitle, experienceLevel || userDoc.experienceLevel || 'fresher');
      if (snippets.length === 0) snippets = [`Standard requirements for ${jobTitle} at ${experienceLevel} level`]; // Fallback
      
      const structuredJD = await cleanAndStructureJD(snippets, jobTitle, experienceLevel);
      requiredSkills = structuredJD.allSkillsCombined || structuredJD.requiredSkills || [];
      cleanedJDSummary = structuredJD.cleanedJDSummary;
    }
    
    else if (inputType === 'company-role') {
      const { company, role, experienceLevel } = fields;
      if (!company || !role) return res.status(400).json({ success: false, error: 'Company and role required' });
      
      const { snippets, sources } = await searchCompanyRoleRequirements(company, role);
      let workingSnippets = snippets.length > 0 ? snippets : [`Standard requirements for ${role} at ${company}`];
      
      const companyProfile = await buildCompanySkillProfile(company, role, workingSnippets, sources);
      requiredSkills = companyProfile.allSkillsCombined || companyProfile.requiredSkills || [];
      cleanedJDSummary = `Profile built for ${role} at ${company}. ${companyProfile.difficultyNotes || ''}`;
      
      companyInsights = {
        companySpecificFocus: companyProfile.companySpecificFocus || [],
        interviewTopics: companyProfile.interviewTopics || [],
        difficultyNotes: companyProfile.difficultyNotes || '',
        insiderTips: companyProfile.insiderTips || [],
        sources: sources || []
      };
    }
    
    else if (inputType === 'resume-upload') {
      const resumeFile = files.resumePDF;
      if (!resumeFile) return res.status(400).json({ success: false, error: 'Missing PDF file' });
      
      const buffer = fs.readFileSync(resumeFile.filepath || resumeFile.path);
      const resumeText = await extractTextFromPDF(buffer);
      
      const resumeSkills = await extractSkillsFromResumeText(resumeText);
      userSkills = [...new Set([...userSkills, ...resumeSkills])]; // Merge and deduplicate
      
      const jdText = fields.jdText;
      if (jdText && jdText.length >= 100) {
        const structuredJD = await cleanAndStructureJD([jdText], 'General Role', 'intermediate');
        requiredSkills = structuredJD.allSkillsCombined || structuredJD.requiredSkills || [];
        cleanedJDSummary = structuredJD.cleanedJDSummary;
      } else {
        return res.status(400).json({ success: false, error: 'JD_TOO_SHORT', message: 'Provide JD text with resume' });
      }
    }

    if (userSkills.length === 0) {
       return res.status(400).json({ success: false, error: 'USER_SKILLS_EMPTY', message: 'No skills found in profile or resume.' });
    }
    if (requiredSkills.length === 0) {
       // fallback
       requiredSkills = ['General Programming'];
    }

    // STEP C: Parallel Verification
    let geminiResult, cerebrasResult;
    try {
      [geminiResult, cerebrasResult] = await Promise.all([
        analyzeSkillGap_Gemini(userSkills, requiredSkills, fields.experienceLevel || userDoc.experienceLevel || 'intermediate').catch(e => { console.error('Gemini Failed:', e); return null; }),
        analyzeSkillGap_Cerebras(userSkills, requiredSkills, fields.experienceLevel || userDoc.experienceLevel || 'intermediate').catch(e => { console.error('Cerebras Failed:', e); return null; })
      ]);
    } catch (e) {
      console.error('Parallel execution error:', e);
    }

    if (!geminiResult && !cerebrasResult) {
      return res.status(503).json({ success: false, error: 'AI_UNAVAILABLE', retry: true });
    }

    // STEP D: Merge (Node.js Logic)
    const mergedResult = mergeGapResults(geminiResult, cerebrasResult, requiredSkills);

    // STEP E: (Resources are now fetched on-demand via /api/skills/fetch-resources)

    // STEP F: Save to DB
    const newAnalysis = new SkillAnalysis({
      userId: user._id,
      inputType,
      input: {
        jdText: fields.jdText || '',
        jobTitle: fields.jobTitle || '',
        company: fields.company || '',
        role: fields.role || '',
        experienceLevel: fields.experienceLevel || '',
        jdSourceUrl: fields.jdSourceUrl || ''
      },
      userSkillsSnapshot: userSkills,
      requiredSkills,
      cleanedJDSummary,
      result: mergedResult,
      companyInsights
    });

    await newAnalysis.save();

    // STEP G: Return Response
    return res.status(200).json({
      success: true,
      analysisId: newAnalysis._id,
      result: mergedResult,
      companyInsights,
      userSkillsUsed: userSkills,
      requiredSkillsCount: requiredSkills.length,
      inputType,
      analyzedAt: newAnalysis.analyzedAt,
      aiWarning: (!geminiResult || !cerebrasResult) ? 'Single AI analysis (verification unavailable)' : null
    });

  } catch (error) {
    console.error('[Analyze Route Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
