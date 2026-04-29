import connectDB from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import InterviewSession from '@/models/InterviewSession';
import { fetchInterviewQuestions } from '@/lib/exa';
import { generateFirstQuestion } from '@/lib/cerebras';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const { company, role, interviewType, difficulty, totalQuestions = 12, jobDescription, focusAreas } = req.body;

    if (!company || !role || !interviewType || !difficulty) {
      return res.status(400).json({ success: false, error: 'Missing required configuration fields', code: 'MISSING_FIELDS' });
    }
    
    // Cap at 15
    const finalTotalQuestions = Math.min(Math.max(totalQuestions, 5), 15);

    await connectDB();

    const userProfile = {
      name: user.name || 'Candidate',
      experienceLevel: user.currentStatus || 'Professional',
      skills: user.skills || [],
      targetRole: user.targetRole || role
    };

    const sessionConfig = { company, role, interviewType, difficulty, totalQuestions: finalTotalQuestions, jobDescription, focusAreas };

    // STEP A: Fetch raw questions from Exa Search (or fallback)
    const rawQuestions = await fetchInterviewQuestions(company, role, difficulty, interviewType);

    // STEP B: Create Session
    const session = new InterviewSession({
      userId: user._id,
      config: sessionConfig,
      userProfile,
      rawQuestionsFromExa: rawQuestions,
      status: 'active',
      startedAt: new Date()
    });

    await session.save();

    // STEP C: Generate first question using Cerebras
    let q1;
    try {
      q1 = await generateFirstQuestion(rawQuestions, userProfile, sessionConfig);
    } catch (e) {
      console.error('[Setup] Cerebras Error:', e.message);
      // Fallback if AI fails completely to not break flow
      q1 = {
        greeting: `Hello ${userProfile.name}, welcome to your interview.`,
        questionText: rawQuestions[0] || "Could you start by telling me a little about yourself and your background?",
        questionType: "general",
        topic: "Introduction",
        difficulty: 5,
        hints: ["Focus on your professional background", "Highlight relevant skills"],
        idealAnswerOutline: "A concise summary of past experience, current role, and future goals."
      };
    }

    const firstMessage = {
      questionNumber: 1,
      questionText: q1.questionText,
      questionType: q1.questionType,
      topic: q1.topic,
      difficulty: q1.difficulty,
      hints: q1.hints || [],
      idealAnswerOutline: q1.idealAnswerOutline,
      askedAt: new Date()
    };

    session.messages.push(firstMessage);
    session.currentQuestionNumber = 1;
    await session.save();

    return res.status(200).json({
      success: true,
      sessionId: session._id,
      greeting: q1.greeting,
      question: {
        number: 1,
        text: q1.questionText,
        type: q1.questionType,
        topic: q1.topic,
        totalQuestions: finalTotalQuestions
      },
      speakText: `${q1.greeting || ''} ${q1.questionText || ''}`.trim()
    });

  } catch (error) {
    console.error('[Setup API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
