import mongoose from 'mongoose';

const TopicProgressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  estimatedHours: { type: Number },
  resourceHint: { type: String },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  resources: [{
    title: { type: String },
    url: { type: String },
    platform: { type: String },
    type: { type: String, enum: ['video', 'docs', 'course', 'practice', 'article'] },
    estimatedMinutes: { type: Number },
    isFree: { type: Boolean }
  }]
}, { _id: false });

const WeekDataSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  topics: [TopicProgressSchema],
  weeklyProject: { type: String },
  milestone: { type: String },
  estimatedTotalHours: { type: Number },
  
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  
  replanningNote: { type: String },
  wasCompressed: { type: Boolean, default: false }
}, { _id: false });

const RoadmapSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  
  title: { type: String, required: true },
  goal: { type: String, required: true },
  templateId: { type: String },
  
  config: {
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    dailyHours: { type: Number },
    weeklyHours: { type: Number },
    learningStyle: { type: String, enum: ['video', 'reading', 'project', 'mixed'] },
    targetDeadline: { type: String, enum: ['1month', '3months', '6months', '1year'] },
    budget: { type: String, enum: ['free', 'paid'] },
    importedFromAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillAnalysis' }
  },
  
  weeks: [WeekDataSchema],
  totalWeeks: { type: Number },
  
  marketInfluenced: [{ type: String }],
  portfolioProjects: [{ type: String }],
  finalOutcome: { type: String },
  
  progress: {
    completedWeeks: { type: Number, default: 0 },
    completedTopics: { type: Number, default: 0 },
    totalTopics: { type: Number, default: 0 },
    percentComplete: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActivityAt: { type: Date }
  },
  
  marketTrends: {
    trendingSkills: [{ type: String }],
    fetchedAt: { type: Date }
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'archived'],
    default: 'active'
  },
  
  shareableSlug: { type: String },
  isPublic: { type: Boolean, default: false },
  
  regenerationCount: { type: Number, default: 0 },
  lastRegeneratedAt: { type: Date }
}, { timestamps: true });

// Ensure uniqueness of shareable slug (sparse ensures it ignores docs without slug)
RoadmapSchema.index({ shareableSlug: 1 }, { unique: true, sparse: true });
RoadmapSchema.index({ userId: 1, status: 1, createdAt: -1 });

RoadmapSchema.pre('save', async function() {
  const totalTopics = this.weeks.reduce((sum, w) => sum + (w.topics?.length || 0), 0);
  const completedTopics = this.weeks.reduce((sum, w) =>
    sum + (w.topics?.filter(t => t.completed)?.length || 0), 0
  );
  const completedWeeks = this.weeks.filter(w => w.completed).length;

  if (!this.progress) this.progress = {};

  this.progress.totalTopics = totalTopics;
  this.progress.completedTopics = completedTopics;
  this.progress.completedWeeks = completedWeeks;
  this.progress.percentComplete = totalTopics > 0
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;

  if (completedTopics === totalTopics && totalTopics > 0) {
    this.status = 'completed';
  }
});

export default mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);
