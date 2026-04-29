import mongoose from 'mongoose';

const SkillEntrySchema = new mongoose.Schema({
  skill: { type: String, required: true },
  confidence: { type: String, enum: ['full', 'partial'], required: true },
  note: { type: String }
}, { _id: false });

const ResourceSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String },
  domain: { type: String },
  type: { type: String, enum: ['video', 'docs', 'course', 'practice', 'article'] },
  estimatedTime: { type: String }
}, { _id: false });

const MissingSkillEntrySchema = new mongoose.Schema({
  skill: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'] },
  reason: { type: String },
  estimatedWeeks: { type: Number },
  confidence: { type: String, enum: ['verified', 'unverified'] },
  resources: [ResourceSchema]
}, { _id: false });

const SkillAnalysisSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  
  inputType: {
    type: String,
    enum: ['paste-jd', 'job-title', 'company-role', 'resume-upload'],
    required: true
  },
  
  input: {
    jdText: { type: String },
    jobTitle: { type: String },
    company: { type: String },
    role: { type: String },
    experienceLevel: { type: String },
    jdSourceUrl: { type: String }
  },
  
  userSkillsSnapshot: [{ type: String }],
  
  requiredSkills: [{ type: String }],
  cleanedJDSummary: { type: String },
  
  result: {
    confirmed: [SkillEntrySchema],
    highPriority: [MissingSkillEntrySchema],
    mediumPriority: [MissingSkillEntrySchema],
    lowPriority: [MissingSkillEntrySchema],
    gapScore: { type: Number },
    totalWeeksToReady: { type: Number },
    summaryNote: { type: String }
  },
  
  companyInsights: {
    companySpecificFocus: [{ type: String }],
    interviewTopics: [{ type: String }],
    difficultyNotes: { type: String },
    insiderTips: [{ type: String }],
    sources: [{ type: String }]
  },
  
  roadmapCreated: { type: Boolean, default: false },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
  
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SkillAnalysisSchema.index({ userId: 1, analyzedAt: -1 });

export default mongoose.models.SkillAnalysis || mongoose.model("SkillAnalysis", SkillAnalysisSchema);
