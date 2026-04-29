import mongoose from 'mongoose';

const generatedVersionSchema = new mongoose.Schema({
  version: Number,
  label: String,
  subject: String,
  message: String,
  wordCount: Number,
  hookUsed: String,
  selected: { type: Boolean, default: false }
}, { _id: false });

const qualityScoreSchema = new mongoose.Schema({
  version: Number,
  personalization: Number,
  clarity: Number,
  callToAction: Number,
  desperationLevel: Number,
  overallScore: Number,
  spamPhrases: [String],
  suggestions: [String]
}, { _id: false });

const followUpSequenceSchema = new mongoose.Schema({
  day: Number,
  label: String,
  subject: String,
  message: String,
  angle: String,
  sent: { type: Boolean, default: false },
  sentAt: Date
}, { _id: false });

const outreachMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  recipientName: String,
  recipientRole: String,
  company: String,
  linkedinUrl: String,
  
  messageType: {
    type: String,
    enum: ['linkedin', 'email', 'followup', 'referral', 'thankyou', 'negotiation', 'decline']
  },
  tone: String,
  senderGoal: String,
  
  path: { type: String, enum: ['A', 'B', 'C'] },
  
  generatedVersions: [generatedVersionSchema],
  
  qualityScores: [qualityScoreSchema],
  
  followUpSequence: [followUpSequenceSchema],
  
  hooksUsed: mongoose.Schema.Types.Mixed,
  
  feedback: {
    gotReply: { type: Boolean, default: null },
    repliedAt: Date,
    userRating: { type: Number, min: 1, max: 5 }
  },
  
  savedAsTemplate: { type: Boolean, default: false },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'OutreachTemplate' },
  
  crossModuleSource: {
    module: String, // 'company-research'|'mock-interview'|'manual'
    sourceId: mongoose.Schema.Types.ObjectId
  }
}, { timestamps: true });

outreachMessageSchema.index({ userId: 1, company: 1, createdAt: -1 });
outreachMessageSchema.index({ userId: 1, messageType: 1 });

export default mongoose.models.OutreachMessage || mongoose.model('OutreachMessage', outreachMessageSchema);
