import connectDB from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import InterviewSession from '@/models/InterviewSession';
import { evaluateAnswer } from '@/lib/gemini';
import { generateAdaptiveNextQuestion, generateInterviewReport } from '@/lib/cerebras';

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

    const { sessionId, questionNumber, answerText, answerMode = 'text', answerDuration = 0 } = req.body;

    if (!sessionId || !questionNumber || !answerText) {
      return res.status(400).json({ success: false, error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    if (answerText.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Answer is too short to evaluate properly.', code: 'ANSWER_TOO_SHORT' });
    }

    await connectDB();

    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Session is no longer active', code: 'SESSION_NOT_ACTIVE' });
    }

    const currentMsgIndex = questionNumber - 1;
    if (currentMsgIndex < 0 || currentMsgIndex >= session.messages.length) {
      return res.status(400).json({ success: false, error: 'Invalid question number', code: 'INVALID_QUESTION' });
    }

    const currentMsg = session.messages[currentMsgIndex];
    
    if (currentMsg.evaluation && currentMsg.evaluation.score !== undefined) {
      return res.status(400).json({ success: false, error: 'Question already answered', code: 'QUESTION_ALREADY_ANSWERED' });
    }

    // Step 1: Update message with user's answer
    currentMsg.answerText = answerText;
    currentMsg.answerMode = answerMode;
    currentMsg.answerDuration = answerDuration;
    currentMsg.answeredAt = new Date();

    // Step 2: Gemini Evaluation
    let evaluation;
    try {
      evaluation = await evaluateAnswer(
        currentMsg.questionText,
        currentMsg.questionType,
        currentMsg.topic,
        currentMsg.idealAnswerOutline,
        answerText,
        session.userProfile.experienceLevel
      );
    } catch (e) {
      console.error('[Answer API] Gemini Eval Error:', e.message);
      // Fallback evaluation if Gemini fails
      evaluation = {
        score: 5,
        technicalAccuracy: 5,
        communicationClarity: 5,
        depthOfKnowledge: 5,
        verdict: 'Acceptable',
        strengths: ['Attempted to answer the prompt.'],
        improvements: ['Could not run deep evaluation due to AI endpoint failure.'],
        missedConcepts: [],
        idealAnswer: currentMsg.idealAnswerOutline || 'Detailed technical answer to the question.',
        quickFeedback: 'Good try. I experienced a slight glitch evaluating that completely, but let us move on.',
        followUpSuggestion: ''
      };
    }

    currentMsg.evaluation = evaluation;
    
    // Partial save to ensure answer is logged immediately
    await session.save();

    // Step 3: Check if Interview is Complete
    const isComplete = questionNumber >= session.config.totalQuestions;

    if (isComplete) {
      let report;
      try {
        report = await generateInterviewReport(session);
      } catch (e) {
        console.error('[Answer API] Report Error:', e.message);
        report = {
          overallScore: evaluation.score,
          grade: 'Unknown',
          summary: 'Interview concluded. Detailed analysis unavailable at this time.',
          topStrengths: [],
          areasToImprove: [],
          recommendedTopics: [],
          readinessVerdict: 'Needs more prep'
        };
      }

      // Calculate averages safely
      const validEvals = session.messages.filter(m => m.evaluation && m.evaluation.score !== undefined).map(m => m.evaluation);
      const avgTech = validEvals.reduce((sum, e) => sum + (e.technicalAccuracy || 0), 0) / validEvals.length || 0;
      const avgComm = validEvals.reduce((sum, e) => sum + (e.communicationClarity || 0), 0) / validEvals.length || 0;
      const avgDepth = validEvals.reduce((sum, e) => sum + (e.depthOfKnowledge || 0), 0) / validEvals.length || 0;
      const avgOverall = validEvals.reduce((sum, e) => sum + (e.score || 0), 0) / validEvals.length || 0;

      session.report = {
        ...report,
        avgScores: { technical: avgTech, communication: avgComm, depth: avgDepth, overall: avgOverall },
        generatedAt: new Date()
      };
      
      session.status = 'completed';
      session.completedAt = new Date();
      session.totalDuration = (session.completedAt.getTime() - session.startedAt.getTime()) / 1000;
      
      await session.save();

      return res.status(200).json({
        success: true,
        evaluation: {
          score: evaluation.score,
          verdict: evaluation.verdict,
          quickFeedback: evaluation.quickFeedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          idealAnswer: evaluation.idealAnswer
        },
        isComplete: true,
        sessionId: session._id,
        finalScore: session.report.overallScore || avgOverall,
        grade: session.report.grade || 'N/A'
      });
    }

    // Step 4: Generate Adaptive Next Question
    const sessionHistory = session.messages.map(m => ({
      questionText: m.questionText,
      answerText: m.answerText,
      evaluation: m.evaluation,
      topic: m.topic
    }));
    
    const questionsAlreadyAsked = session.messages.map(m => m.topic);
    
    let nextQ;
    try {
      nextQ = await generateAdaptiveNextQuestion(
        sessionHistory, 
        session.rawQuestionsFromExa, 
        evaluation.score, 
        questionsAlreadyAsked, 
        session.config
      );
    } catch (e) {
      console.error('[Answer API] Next Question Error:', e.message);
      // Fallback
      nextQ = {
        transitionText: 'Interesting. Let us move to the next topic.',
        questionText: session.rawQuestionsFromExa[questionNumber] || 'What is the most challenging technical project you have worked on?',
        questionType: 'general',
        topic: 'Experience',
        difficulty: 5,
        hints: [],
        idealAnswerOutline: 'Structured walkthrough of a project.'
      };
    }

    const nextMessage = {
      questionNumber: questionNumber + 1,
      questionText: nextQ.questionText,
      questionType: nextQ.questionType,
      topic: nextQ.topic,
      difficulty: nextQ.difficulty || 5,
      hints: nextQ.hints || [],
      idealAnswerOutline: nextQ.idealAnswerOutline || '',
      askedAt: new Date()
    };

    session.messages.push(nextMessage);
    session.currentQuestionNumber = questionNumber + 1;
    await session.save();

    return res.status(200).json({
      success: true,
      evaluation: {
        score: evaluation.score,
        verdict: evaluation.verdict,
        quickFeedback: evaluation.quickFeedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        idealAnswer: evaluation.idealAnswer
      },
      isComplete: false,
      nextQuestion: {
        number: questionNumber + 1,
        text: nextQ.questionText,
        type: nextQ.questionType,
        topic: nextQ.topic,
        totalQuestions: session.config.totalQuestions
      },
      speakText: nextQ.questionText.trim()
    });

  } catch (error) {
    console.error('[Answer API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
