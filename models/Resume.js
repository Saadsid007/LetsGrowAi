import mongoose from 'mongoose';

const PersonalInfoSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  summary: { type: String, default: '' }
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrentlyStudying: { type: Boolean, default: false },
  grade: { type: String, default: '' },
  achievements: [{ type: String }]
});

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrentJob: { type: Boolean, default: false },
  bullets: [{ type: String }],
  originalBullets: [{ type: String }],
  aiEnhanced: { type: Boolean, default: false }
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  techStack: [{ type: String }],
  liveUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  bullets: [{ type: String }],
  originalDescription: { type: String, default: '' }
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' }
});

const ATSScoreRecordSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  jobDescription: { type: String, default: '' },
  breakdown: {
    keywordMatch: { type: Number, default: 0 },
    formatScore: { type: Number, default: 0 },
    sectionCompleteness: { type: Number, default: 0 },
    readabilityScore: { type: Number, default: 0 }
  },
  missingKeywords: [{ type: String }],
  presentKeywords: [{ type: String }],
  suggestions: [{ type: String }],
  analyzedAt: { type: Date, default: Date.now }
});

const ResumeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  title: { type: String, default: 'My Resume', trim: true },
  version: { type: Number, default: 1 },
  templateId: { 
    type: String, 
    enum: ['clean', 'modern', 'ats-friendly'],
    default: 'ats-friendly'
  },
  sections: {
    personal: { type: PersonalInfoSchema, default: {} },
    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    skills: {
      technical: { type: [String], default: [] },
      soft: { type: [String], default: [] },
      tools: { type: [String], default: [] }
    },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    customSections: [{
      id: { type: String },
      title: { type: String },
      content: { type: String }
    }],
    sectionTitles: { type: mongoose.Schema.Types.Mixed, default: {} },
    layoutOrder: { 
      type: [String], 
      default: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'] 
    }
  },
  atsHistory: { type: [ATSScoreRecordSchema], default: [] },
  latestAtsScore: { type: Number, default: null },
  completenessScore: { type: Number, default: 0 },
  pdfUrl: { type: String, default: '' },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Compound index to quickly find the latest resumes for a user
ResumeSchema.index({ userId: 1, updatedAt: -1 });

// Prevent model recompilation on hot reload in development
const Resume = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);

export default Resume;
