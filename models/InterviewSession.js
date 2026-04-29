import mongoose from "mongoose";

const SessionConfigSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  interviewType: { 
    type: String, 
    enum: ['technical', 'hr', 'behavioral', 'system-design', 'mixed'],
    required: true
  },
  difficulty: { 
    type: String, 
    enum: ['fresher', 'medium', 'senior'],
    required: true
  },
  totalQuestions: { type: Number, default: 12 },
  jobDescription: { type: String },
  focusAreas: { type: String }
}, { _id: false });

const AnswerEvaluationSchema = new mongoose.Schema({
  score: { type: Number },
  technicalAccuracy: { type: Number },
  communicationClarity: { type: Number },
  depthOfKnowledge: { type: Number },
  verdict: { type: String },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  missedConcepts: [{ type: String }],
  idealAnswer: { type: String },
  quickFeedback: { type: String },
  followUpSuggestion: { type: String }
}, { _id: false });

const SessionMessageSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionText: { type: String, required: true },
  questionType: { type: String },
  topic: { type: String },
  difficulty: { type: Number }, 
  hints: [{ type: String }],
  idealAnswerOutline: { type: String },
  
  answerText: { type: String },
  answerMode: { 
    type: String, 
    enum: ['text', 'voice'],
    default: 'text'
  },
  answerDuration: { type: Number }, 
  
  evaluation: { type: AnswerEvaluationSchema },
  
  askedAt: { type: Date, default: Date.now },
  answeredAt: { type: Date }
});

const SessionReportSchema = new mongoose.Schema({
  overallScore: { type: Number },
  grade: { type: String },
  summary: { type: String },
  topStrengths: [{ type: String }],
  areasToImprove: [{ type: String }],
  recommendedTopics: [{ type: String }],
  readinessVerdict: { type: String },
  
  avgScores: {
    technical: { type: Number },
    communication: { type: Number },
    depth: { type: Number },
    overall: { type: Number }
  },
  
  generatedAt: { type: Date }
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  config: { type: SessionConfigSchema, required: true },
  
  userProfile: {
    name: { type: String },
    experienceLevel: { type: String },
    skills: [{ type: String }],
    targetRole: { type: String }
  },
  
  status: {
    type: String,
    enum: ['setup', 'active', 'completed', 'abandoned'],
    default: 'setup'
  },
  
  rawQuestionsFromExa: [{ type: String }],
  exaSourceUrls: [{ type: String }],
  
  messages: [SessionMessageSchema],
  currentQuestionNumber: { type: Number, default: 0 },
  
  report: { type: SessionReportSchema },
  
  startedAt: { type: Date },
  completedAt: { type: Date },
  totalDuration: { type: Number }
}, { timestamps: true });

InterviewSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.models.InterviewSession || mongoose.model("InterviewSession", InterviewSessionSchema);
