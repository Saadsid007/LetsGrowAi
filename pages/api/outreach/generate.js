import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OutreachMessage from '@/models/OutreachMessage';
import { fetchPersonProfile } from '@/lib/exa';
import { searchPersonContext } from '@/lib/serper';
import { extractPersonalizationHooks, scoreMessageQuality } from '@/lib/gemini';
import { generateOutreachMessages } from '@/lib/cerebras';
import { checkSpamTriggers, countWords } from '@/lib/outreachUtils';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await connectDB();

    const { 
      messageType, 
      recipientName, 
      recipientRole, 
      company, 
      linkedinUrl, 
      senderGoal, 
      tone,
      crossModuleSource
    } = req.body;

    if (!messageType || !recipientName || !recipientRole || !company || !senderGoal || senderGoal.length < 10) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const userDoc = await User.findById(user._id).select('name skills experienceLevel targetRole location');
    const technicalSkills = userDoc.skills && userDoc.skills.technical ? userDoc.skills.technical.slice(0, 8).join(', ') : '';
    const senderContext = `
      Name: ${userDoc.name || ''}
      Experience: ${userDoc.experienceLevel || ''}
      Skills: ${technicalSkills}
      Target Role: ${userDoc.targetRole || recipientRole}
    `;

    let path = 'C';
    if (linkedinUrl) path = 'A';
    else if (recipientName && company) path = 'B';

    let hooks = null;
    let pathDowngraded = false;
    let downgradeReason = '';

    if (path === 'A') {
      try {
        const profile = await fetchPersonProfile(linkedinUrl, company);
        if (profile.dataFound) {
          hooks = await extractPersonalizationHooks(profile, recipientName, recipientRole, company);
        } else {
          path = 'B'; // Exa failed to find much, fallback to Serper conceptually or just try Serper
          pathDowngraded = true;
          downgradeReason = 'exa_failed';
        }
      } catch (e) {
        console.warn('Exa failed, downgrading to B');
        path = 'B';
        pathDowngraded = true;
        downgradeReason = 'exa_error';
      }
    }

    if (path === 'B') {
      try {
        const context = await searchPersonContext(recipientName, recipientRole, company);
        if (context.dataFound) {
          hooks = await extractPersonalizationHooks(context, recipientName, recipientRole, company);
        } else {
          path = 'C';
          pathDowngraded = true;
          downgradeReason = 'serper_failed';
        }
      } catch (e) {
        console.warn('Serper failed, downgrading to C');
        path = 'C';
        pathDowngraded = true;
        downgradeReason = 'serper_error';
      }
    }

    // Cerebras Generation
    let generated;
    try {
      generated = await generateOutreachMessages({
        messageType,
        recipientName,
        recipientRole,
        company,
        senderGoal,
        tone: tone || 'professional',
        hooks,
        senderContext,
        linkedinUrlProvided: !!linkedinUrl
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'GENERATION_FAILED', message: err.message });
    }

    // Parallel Quality Scoring & Saving
    let qualityScores = null;
    let savedMessage = null;
    let qualityScoreAvailable = true;

    try {
      const messagesText = generated.versions.map(v => v.message);
      
      const [scoresResult, dbSaveResult] = await Promise.allSettled([
        scoreMessageQuality(messagesText, messageType, senderGoal),
        OutreachMessage.create({
          userId: user._id,
          recipientName,
          recipientRole,
          company,
          linkedinUrl: linkedinUrl || null,
          messageType,
          tone: tone || 'professional',
          senderGoal,
          path,
          generatedVersions: generated.versions,
          hooksUsed: hooks,
          crossModuleSource: crossModuleSource || undefined
        })
      ]);

      if (scoresResult.status === 'fulfilled' && scoresResult.value) {
        qualityScores = scoresResult.value;
      } else {
        qualityScoreAvailable = false;
        console.warn('Scoring failed', scoresResult.reason);
      }

      if (dbSaveResult.status === 'fulfilled') {
        savedMessage = dbSaveResult.value;
        if (qualityScores) {
          // Update message with scores
          await OutreachMessage.findByIdAndUpdate(savedMessage._id, {
            qualityScores: qualityScores.scores
          });
        }
      } else {
        console.error('Failed to save message to DB', dbSaveResult.reason);
      }

    } catch (e) {
      console.error('Parallel save/score error', e);
    }

    // Spam Check
    const spamCheck = generated.versions.map(v => ({
      version: v.version,
      spamTriggers: checkSpamTriggers(v.message),
      wordCount: countWords(v.message)
    }));

    return res.status(200).json({
      success: true,
      messageId: savedMessage ? savedMessage._id : null,
      path,
      pathDowngraded,
      downgradeReason,
      versions: generated.versions,
      quality: qualityScores,
      qualityScoreAvailable,
      spamCheck,
      hooks: hooks ? {
        hooksFound: hooks.hooks ? hooks.hooks.length : 0,
        bestHook: hooks.suggestedOpeningAngle,
        companyContext: hooks.companyContext
      } : null,
      crossModuleLinks: {
        generateSequence: `/api/outreach/sequence`,
        saveAsTemplate: `/api/outreach/templates`
      }
    });

  } catch (error) {
    console.error('[Outreach Generate API Error]', error);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
}
