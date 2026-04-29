import connectDB from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import InterviewSession from '@/models/InterviewSession';
import { generateInterviewReport } from '@/lib/cerebras';

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

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required', code: 'MISSING_ID' });
    }

    await connectDB();

    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, error: `Session is already ${session.status}`, code: 'SESSION_NOT_ACTIVE' });
    }

    // Filter out unanswered questions
    const answeredMessages = session.messages.filter(m => m.evaluation && m.evaluation.score !== undefined);
    
    if (answeredMessages.length === 0) {
      // If none answered, just delete the session purely to keep DB clean
      await InterviewSession.deleteOne({ _id: sessionId });
      return res.status(200).json({ success: true, message: 'Session deleted as no questions were answered.', deleted: true });
    }

    // Since they answered some, generate a partial report
    const validEvals = answeredMessages.map(m => m.evaluation);
    const avgTech = validEvals.reduce((sum, e) => sum + (e.technicalAccuracy || 0), 0) / validEvals.length || 0;
    const avgComm = validEvals.reduce((sum, e) => sum + (e.communicationClarity || 0), 0) / validEvals.length || 0;
    const avgDepth = validEvals.reduce((sum, e) => sum + (e.depthOfKnowledge || 0), 0) / validEvals.length || 0;
    const avgOverall = validEvals.reduce((sum, e) => sum + (e.score || 0), 0) / validEvals.length || 0;

    // Collect strengths and weaknesses from individual evaluations
    const allStrengths = [];
    const allWeaknesses = [];
    const allMissed = [];
    validEvals.forEach(ev => {
      if (ev.strengths) allStrengths.push(...ev.strengths);
      if (ev.improvements) allWeaknesses.push(...ev.improvements);
      if (ev.missedConcepts) allMissed.push(...ev.missedConcepts);
    });
    // Deduplicate
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
    const uniqueWeaknesses = [...new Set([...allWeaknesses, ...allMissed])].slice(0, 5);

    // Determine grade from average score
    let grade = 'Needs Work';
    if (avgOverall >= 8) grade = 'Excellent';
    else if (avgOverall >= 6) grade = 'Good';
    else if (avgOverall >= 4) grade = 'Average';

    let report;
    try {
      // Temporarily set messages to only the answered ones for accurate reporting context
      const tempMessages = session.messages;
      session.messages = answeredMessages;
      // Pre-set avgScores so reportGenerator can use them
      session.report = { avgScores: { technical: avgTech, communication: avgComm, depth: avgDepth } };
      report = await generateInterviewReport(session);
      session.messages = tempMessages; // restore full state
    } catch (e) {
      console.error('[End API] Partial Report Error:', e.message);
      // Build a meaningful fallback from collected per-question data
      const overallScore = Math.round(avgOverall * 10);
      report = {
        overallScore,
        grade,
        summary: `Interview ended early after ${answeredMessages.length} of ${session.config.totalQuestions} questions. Average score: ${avgOverall.toFixed(1)}/10. ${avgOverall >= 6 ? 'Showed reasonable understanding in the topics covered.' : 'Significant gaps identified in the topics covered. More preparation is recommended.'}`,
        topStrengths: uniqueStrengths.length > 0 ? uniqueStrengths : ['No strong patterns identified from partial data.'],
        areasToImprove: uniqueWeaknesses.length > 0 ? uniqueWeaknesses : ['Complete more questions for a detailed weakness analysis.'],
        recommendedTopics: answeredMessages.map(m => m.topic).filter(Boolean).slice(0, 5),
        readinessVerdict: avgOverall >= 7 ? 'Almost ready' : 'Need more prep'
      };
    }

    session.report = {
      ...report,
      avgScores: { technical: avgTech, communication: avgComm, depth: avgDepth, overall: avgOverall },
      generatedAt: new Date()
    };
    
    session.status = 'abandoned';
    session.completedAt = new Date();
    session.totalDuration = (session.completedAt.getTime() - session.startedAt.getTime()) / 1000;
    
    await session.save();

    return res.status(200).json({
      success: true,
      reportId: session._id,
      message: 'Session forced ended and partial report generated.',
      partial: true
    });

  } catch (error) {
    console.error('[End API Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
