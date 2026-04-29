import OpenAI from 'openai';
import { getLimitForType } from './outreachUtils';

const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY || '',
  baseURL: 'https://api.cerebras.ai/v1'
});

// const CEREBRAS_MODEL = 'llama3.1-70b';
const CEREBRAS_MODEL = 'llama3.1-8b';

/**
 * Rewrite bullet points for a specific role
 */
export async function enhanceBulletPoints(bullets, role, company) {
  if (!process.env.CEREBRAS_API_KEY) {
    console.warn('CEREBRAS_API_KEY not found. Fallback to original bullets.');
    throw new Error('AI_UNAVAILABLE');
  }

  try {
    const prompt = `You are an expert resume writer. Rewrite these bullet points for a ${role} position at ${company}.

Rules:
- Start each bullet with a STRONG action verb (Led, Built, Optimized, Architected, Reduced, Increased, Delivered)
- Add quantifiable metrics where reasonable (%, numbers, time)
- Keep each bullet under 20 words
- Make it ATS-friendly with relevant keywords
- Do NOT add fake numbers — if no metric exists, use strong verb only
- Return ONLY a valid JSON array of strings. No explanation. No markdown.

Bullets to rewrite:
${JSON.stringify(bullets)}`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' } // Enforce JSON (if supported, otherwise handled by parsing)
    });

    let rawContent = response.choices[0].message.content.trim();
    
    // Quick cleanup in case LLM wraps response in markdown code blocks
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
      // Sometimes it might return { "bullets": [...] } due to json_object enforcement
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length > 0 && Array.isArray(parsed[keys[0]])) {
           parsed = parsed[keys[0]];
        } else {
           throw new Error("Invalid structure returned");
        }
      }
    } catch {
      // If parsing fails for some reason
      throw new Error(`Parse failed for response: ${rawContent}`);
    }
    
    if (!Array.isArray(parsed)) throw new Error('Result is not an array');
    return parsed;
  } catch (error) {
    console.error('[Cerebras Error - enhanceBulletPoints]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate a professional summary based on profile details
 */
export async function generateProfessionalSummary(name, targetRole, skills, experienceYears, highlights) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  try {
    const prompt = `Write a professional resume summary for ${name}, a ${experienceYears} ${targetRole}.

Key skills: ${skills.join(', ')}
Notable achievements: ${highlights.join(' | ')}

Rules:
- 3-4 sentences maximum
- Start with role title (e.g. 'Full Stack Developer with...')
- Mention top 2-3 skills
- Include 1 achievement or value proposition
- ATS-friendly — include the exact job title
- Return ONLY the summary text, no quotes, no explanation`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    let summary = response.choices[0].message.content.trim();
    // remove quotes if the model wrapped it
    if (summary.startsWith('"') && summary.endsWith('"')) {
      summary = summary.substring(1, summary.length - 1);
    }
    return summary;
  } catch (error) {
    console.error('[Cerebras Error - generateProfessionalSummary]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Convert a long description into strong bullet points
 */
export async function rewriteProjectDescription(title, description, techStack) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  try {
    const prompt = `Rewrite this project description as 3 strong resume bullet points.
Project: ${title}
Description: ${description}
Tech used: ${techStack.join(', ')}

Rules:
- Bullet 1: What you built (action verb + what + tech)
- Bullet 2: Key feature or challenge solved
- Bullet 3: Impact or result (users, performance, outcome)
- Under 20 words each
- Return ONLY a JSON array of 3 strings. No markdown, no explanation.`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    let rawContent = response.choices[0].message.content.trim();
    
    // Quick cleanup
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length > 0 && Array.isArray(parsed[keys[0]])) {
           parsed = parsed[keys[0]];
        }
      }
    } catch {
       throw new Error(`Parse failed for response: ${rawContent}`);
    }

    if (!Array.isArray(parsed)) throw new Error('Result is not an array');
    return parsed;
  } catch (error) {
    console.error('[Cerebras Error - rewriteProjectDescription]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate the FIRST interview question
 */
export async function generateFirstQuestion(rawQuestions, userProfile, sessionConfig) {
  if (!process.env.CEREBRAS_API_KEY) throw new Error('AI_UNAVAILABLE');

  try {
    const prompt = `You are a professional interviewer at ${sessionConfig.company} conducting a ${sessionConfig.difficulty} level ${sessionConfig.interviewType} interview for a ${sessionConfig.role} position.

Candidate profile:
- Name: ${userProfile.name}
- Experience: ${userProfile.experienceLevel}
- Skills: ${(userProfile.skills || []).join(', ')}

${sessionConfig.jobDescription ? `Context regarding the target Job Role & Responsibilities:
${sessionConfig.jobDescription}
` : ''}
${sessionConfig.focusAreas ? `Candidate specifically wants the interview to focus heavily on:
${sessionConfig.focusAreas}
` : ''}

Here are real interview questions collected from candidates who interviewed at ${sessionConfig.company}:
${rawQuestions.slice(0,10).map((q,i) => `${i+1}. ${q}`).join('\n')}

Task: Select the BEST opening question from the list above OR create a better one inspired by them. 

Rules:
- Start with a warm professional greeting using candidate's name
- Then ask ONE clear question
- Match difficulty: ${sessionConfig.difficulty}
  * Fresher: fundamentals, simple concepts
  * Medium: practical application, real scenarios
  * Senior: architecture, tradeoffs, leadership
- Keep total response under 80 words
- Sound natural, like a real interviewer speaking
- Return ONLY a valid JSON object. No explanation. No markdown.

{
  "greeting": "warm opening, 1 sentence",
  "questionText": "the actual question, clear and direct",
  "questionType": "conceptual/coding/behavioral/design/hr",
  "topic": "main topic: React Hooks, System Design, etc.",
  "difficulty": "number between 1 and 10",
  "hints": ["hint 1", "hint 2 format as strings"],
  "idealAnswerOutline": "brief outline"
}`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) {
    console.error('[Cerebras Error - generateFirstQuestion]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate ADAPTIVE NEXT interview question
 */
export async function generateAdaptiveNextQuestion(sessionHistory, rawQuestions, lastScore, questionsAsked, sessionConfig) {
  if (!process.env.CEREBRAS_API_KEY) throw new Error('AI_UNAVAILABLE');

  try {
    const prompt = `You are a professional interviewer at ${sessionConfig.company}.
    
Interview so far (last 3 exchanges):
${sessionHistory.slice(-3).map(h => 
  `Q: ${h.questionText}
   A (summary): ${h.answerText ? h.answerText.substring(0,150) : ''}
   Score: ${h.evaluation && h.evaluation.score ? h.evaluation.score : 'N/A'}/10`
).join('\n\n')}

Last answer score: ${lastScore}/10
Questions already asked (don't repeat): ${questionsAsked.join(', ')}

${sessionConfig.jobDescription ? `Context regarding the target Job Role & Responsibilities:
${sessionConfig.jobDescription}
` : ''}
${sessionConfig.focusAreas ? `Candidate specifically wants the interview to focus heavily on:
${sessionConfig.focusAreas}
` : ''}

Additional questions from real ${sessionConfig.company} interviews:
${rawQuestions.slice(0,8).join('\n')}

Task: Choose/create the NEXT interview question.

Adaptation rules:
- If last score <= 4: Ask follow-up on SAME topic (simpler angle). e.g. 'Let me ask that differently...'
- If score 5-7: Move to RELATED next topic
- If score >= 8: Jump to harder/different topic, acknowledge good answer

Keep the interview flowing naturally.
Return ONLY a valid JSON object. No markdown.

{
  "questionText": "the next question",
  "questionType": "string",
  "topic": "string",
  "difficulty": "number between 1 and 10",
  "hints": ["string"],
  "idealAnswerOutline": "string"
}`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) {
    console.error('[Cerebras Error - generateAdaptiveNextQuestion]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate comprehensive Interview Report
 */
export async function generateInterviewReport(session) {
  if (!process.env.CEREBRAS_API_KEY) throw new Error('AI_UNAVAILABLE');

  try {
    const avgTech = session.report && session.report.avgScores ? session.report.avgScores.technical : 0;
    const avgComm = session.report && session.report.avgScores ? session.report.avgScores.communication : 0;
    const avgDepth = session.report && session.report.avgScores ? session.report.avgScores.depth : 0;

    const prompt = `Generate a comprehensive interview performance report.

Candidate: ${session.userProfile.name}
Role: ${session.config.role} at ${session.config.company}
Questions answered: ${session.messages.length}

Performance per question:
${session.messages.map((m,i) => {
  const evalData = m.evaluation || {};
  return `Q${i+1} (${m.topic}): Score ${evalData.score || 0}/10
   Strength: ${(evalData.strengths && evalData.strengths[0]) ? evalData.strengths[0] : 'N/A'}
   Weakness: ${(evalData.improvements && evalData.improvements[0]) ? evalData.improvements[0] : 'N/A'}`;
}).join('\n')}

Average scores:
- Technical: ${avgTech}
- Communication: ${avgComm}
- Depth: ${avgDepth}

Return ONLY this JSON. No markdown.
{
  "overallScore": number (weighted average, 0-100 scale based on all performance),
  "grade": "string ('Excellent'|'Good'|'Average'|'Needs Work')",
  "summary": "3-4 sentence honest assessment highlighting their exact weaknesses and strengths",
  "topStrengths": ["3 technical/behavioral things done extremely well"],
  "areasToImprove": ["3 explicit weak skills / concepts they failed at"],
  "recommendedTopics": ["5 exact topics they must study"],
  "readinessVerdict": "string ('Ready to apply'|'Almost ready'|'Need more prep')"
}`;

    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // Low temp for reporting
      response_format: { type: 'json_object' }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) { 
    console.error('[Cerebras Error - generateInterviewReport]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

// ─── SKILL GAP ANALYZER FUNCTIONS ──────────────────────────────────────────

/**
 * Perform a parallel skill gap analysis for verification
 */
export async function analyzeSkillGap_Cerebras(userSkills, requiredSkills, experienceLevel) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  const prompt = `You are a technical recruiter analyzing a skill gap.

Candidate skills: ${userSkills.join(', ')}
Job requires: ${requiredSkills.join(', ')}
Experience: ${experienceLevel}

Be precise. Don't be generous — if a skill is only partially present, mark it partial.

Return ONLY this JSON array structure:
{
  "matched": [
    { "skill": "React", "confidence": "full" }
  ],
  "missing": [
    {
      "skill": "Docker",
      "priority": "high",
      "estimatedWeeks": 2
    }
  ],
  "gapScore": 60
}`;

  try {
    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert technical recruiter.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Low temp for accurate JSON
      response_format: { type: "json_object" }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) { 
    console.error('[Cerebras Error - analyzeSkillGap]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate 3 versions of outreach messages
 */
export async function generateOutreachMessages(params) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  const hooksText = params.hooks ? `
Best hook to open with: ${params.hooks.suggestedOpeningAngle}
Company context: ${params.hooks.companyContext}
Available hooks:
${params.hooks.hooks.filter(h => h.strength !== 'weak').map(h => `- ${h.type}: "${h.content}" -> ${h.usageHint}`).join('\n')}
` : 'No personal data available — use company context and role relevance';

  const prompt = `You are an expert at writing cold outreach messages that actually get replies.

=== SENDER INFO ===
${params.senderContext}

=== RECIPIENT ===
Name: ${params.recipientName}
Role: ${params.recipientRole} at ${params.company}

=== PERSONALIZATION HOOKS (use these naturally) ===
${hooksText}

=== MESSAGE REQUIREMENTS ===
Type: ${params.messageType}
Goal: ${params.senderGoal}
Tone: ${params.tone}
Limit: ${getLimitForType(params.messageType)}

=== GOLDEN RULES ===
1. Open with THEM (their post, their company, their achievement). NOT with "My name is..." or "I hope this finds you well".
2. One clear ask — not "coffee/call/advice/referral" all at once.
3. Show you researched — 1 specific detail proves you're genuine.
4. Make it easy to say yes — specific ask + specific time.
5. Never: "I know you're busy", "I'll keep this short" (then don't).
6. LinkedIn requests: under 300 chars — ruthless editing.
7. Emails: subject line matters more than body.

=== GENERATE 3 VERSIONS ===
Version 1: Uses the best hook + recommended approach
Version 2: Shorter, punchy version (30% fewer words)
Version 3: More formal/professional version

${params.messageType === 'email' ? 'Include subject line for each email version.' : ''}

Return ONLY this JSON:
{
  "versions": [
    {
      "version": 1,
      "label": "Personalized (Recommended)",
      "subject": "string (email only, omit otherwise)",
      "message": "string",
      "wordCount": 0,
      "hookUsed": "which personalization hook was used"
    },
    { "version": 2, "label": "Shorter Version", "subject": "...", "message": "...", "wordCount": 0, "hookUsed": "..." },
    { "version": 3, "label": "More Formal Version", "subject": "...", "message": "...", "wordCount": 0, "hookUsed": "..." }
  ]
}`;

  try {
    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert outreach writer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) { 
    console.error('[Cerebras Error - generateOutreachMessages]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

/**
 * Generate a follow-up sequence
 */
export async function generateFollowUpSequence(originalMessage, recipientName, recipientRole, company, senderGoal, messageType) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  const prompt = `Generate a follow-up sequence for a cold outreach message.

Original message sent:
${originalMessage}

Recipient: ${recipientName} (${recipientRole} at ${company})
Original goal: ${senderGoal}

Generate 3 follow-up messages (Day 4, Day 10, Day 21).

=== FOLLOW-UP RULES ===
Day 4: Gentle nudge + add VALUE (new insight, resource, or context). Don't just say 'following up'. Reference original message briefly.
Day 10: Shorter, change angle completely. Ask a simpler question they can answer with one line (e.g. 'Quick question about X' — makes it easy to respond).
Day 21: Final message — graceful exit. Make clear it's the last message. Leave door open for future. No guilt-tripping, no desperation. 3-4 sentences max.

Return ONLY this JSON:
{
  "sequence": [
    {
      "day": 4,
      "label": "First Follow-up",
      "subject": "string (if email)",
      "message": "string",
      "angle": "what new value/angle this message adds",
      "wordCount": 0
    },
    { "day": 10, "label": "Second Follow-up", "subject": "...", "message": "...", "angle": "...", "wordCount": 0 },
    { "day": 21, "label": "Final Attempt", "subject": "...", "message": "...", "angle": "...", "wordCount": 0 }
  ],
  "sequenceStrategy": "1-2 sentence overview of the approach"
}`;

  try {
    const response = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert outreach writer specializing in follow-up sequences.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(rawContent);
  } catch (error) { 
    console.error('[Cerebras Error - generateFollowUpSequence]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}

// ─── JD TO RESUME KEY POINTS FUNCTIONS ──────────────────────────────────────

/**
 * Step 2 (parallel): Generate summary/objective + 3 projects
 * Runs 2 Cerebras calls in parallel internally for speed
 */
export async function generateSummaryAndProjects(jdAnalysis, userInfo, sectionsRequested) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  const needsSummary = sectionsRequested.some(s => ['summary', 'objective'].includes(s));
  const needsProjects = sectionsRequested.includes('projects');

  // ─── Call A: Summary + Objective ──────────────────────────────────────
  const summaryPromise = needsSummary
    ? cerebras.chat.completions.create({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert resume writer.' },
          {
            role: 'user',
            content: `Write resume content for a job seeker applying for:
Role: ${jdAnalysis.detectedRole}
Company Type: ${jdAnalysis.companyType || 'unknown'}
Candidate: ${userInfo.experienceLevel}, ${userInfo.yearsOfExp} experience
Their skills: ${(userInfo.existingSkills || []).join(', ')}
JD focus areas: ${(jdAnalysis.focusAreas || []).join(', ')}

WRITE:
1. Professional Summary (3-4 sentences):
   - If candidate is Fresher, DO NOT say "0 years of experience". Focus on academic background, relevant projects, and eagerness to contribute.
   - If candidate has experience, start with role + years of experience.
   - Mention 3-4 key technical skills from JD
   - End with what value they bring
   - NO clichés: no 'passionate', 'hardworking', 'team player'
   - Specific, achievement-oriented language

2. Objective Statement (2 sentences, for fresher only):
   - If seniority is '${jdAnalysis.seniorityLevel}' and it equals 'fresher', write an objective
   - Otherwise set objective to null
   - Goal + what they offer to company

Return ONLY this JSON:
{
  "summary": "string",
  "objective": "string or null"
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      })
    : Promise.resolve(null);

  // ─── Call B: 3 Projects ───────────────────────────────────────────────
  const projectsPromise = needsProjects
    ? cerebras.chat.completions.create({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert resume project generator.' },
          {
            role: 'user',
            content: `Generate 3 realistic resume projects for a candidate.

Target Role: ${jdAnalysis.detectedRole}
Candidate Level: ${jdAnalysis.seniorityLevel}
Candidate's skills: ${(userInfo.existingSkills || []).join(', ')}
JD domains: ${(jdAnalysis.projectDomains || []).join(', ')}
JD tech requirements: ${(jdAnalysis.keyTechnicalSkills || []).slice(0, 8).join(', ')}

=== PROJECT RULES ===
1. Each project must use skills from BOTH candidate's existing skills AND JD required skills
2. Project complexity matches experience level:
   Fresher → college-level, portfolio projects
   Junior → production-ready features
   Mid → full systems with scale considerations
   Senior → architecture-level solutions
3. Bullet points must have IMPACT metrics (percentages, numbers, user counts)
4. Tech stack must be realistic and match JD

Return ONLY this JSON:
{
  "projects": [
    {
      "name": "specific project name",
      "tagline": "one sentence what it does",
      "description": "2-3 sentences, resume-ready",
      "techStack": ["5-7 technologies"],
      "bullets": ["3 impact-driven bullet points"],
      "domain": "e.g. E-Commerce, Social Media",
      "difficulty": "beginner|intermediate|advanced",
      "liveUrl": null,
      "githubUrl": null
    }
  ]
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      })
    : Promise.resolve(null);

  try {
    const [summaryResponse, projectsResponse] = await Promise.all([
      summaryPromise,
      projectsPromise,
    ]);

    let summaryData = { summary: null, objective: null };
    let projectsData = { projects: [] };

    if (summaryResponse) {
      let raw = summaryResponse.choices[0].message.content.trim();
      raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      summaryData = JSON.parse(raw);
    }

    if (projectsResponse) {
      let raw = projectsResponse.choices[0].message.content.trim();
      raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      projectsData = JSON.parse(raw);
    }

    return {
      summary: summaryData.summary || null,
      objective: summaryData.objective || null,
      projects: projectsData.projects || [],
    };
  } catch (error) {
    console.error('[Cerebras Error - generateSummaryAndProjects]', error.message);
    throw new Error('AI_UNAVAILABLE');
  }
}
