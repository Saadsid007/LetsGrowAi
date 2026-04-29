import mongoose from 'mongoose';

const JDResumePointsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    jdText: { type: String, default: '' },       // original pasted JD (truncated to 4000)
    jdUrl: { type: String, default: '' },         // if URL was provided

    // ─── Gemini JD Analysis Output ────────────────────────────────────────
    jdAnalysis: {
      detectedRole: { type: String, default: '' },
      companyType: { type: String, default: 'unknown' },
      experienceRequired: { type: String, default: '' },
      keyTechnicalSkills: [String],
      toolsRequired: [String],
      softSkillsMentioned: [String],
      projectDomains: [String],
      keyResponsibilities: [String],
      niceToHaveSkills: [String],
      seniorityLevel: { type: String, default: 'fresher' },
      focusAreas: [String],
    },

    // ─── Generated Result ─────────────────────────────────────────────────
    result: {
      summary: { type: String, default: '' },
      objective: { type: String, default: '' },

      skills: {
        technical: [
          {
            name: { type: String },
            status: { type: String, enum: ['matched', 'suggested'], default: 'suggested' },
          },
        ],
        tools: [
          {
            name: { type: String },
            status: { type: String, enum: ['matched', 'suggested'], default: 'suggested' },
          },
        ],
        soft: [String],
      },

      projects: [
        {
          name: { type: String, default: '' },
          tagline: { type: String, default: '' },
          description: { type: String, default: '' },
          techStack: [String],
          bullets: [String],
          domain: { type: String, default: '' },
          difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
          liveUrl: { type: String, default: '' },
          githubUrl: { type: String, default: '' },
        },
      ],

      experienceBullets: [String],
    },

    // ─── Snapshot of user info used for generation ────────────────────────
    userInfo: {
      name: { type: String, default: '' },
      experienceLevel: { type: String, default: '' },
      existingSkills: [String],
      yearsOfExp: { type: String, default: '' },
    },

    sectionsGenerated: [String],           // which sections were requested

    usedInResumeId: {                      // set when "Use in Resume Builder" clicked
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },

    analysisQuality: {                     // 'full' or 'basic' (regex fallback)
      type: String,
      enum: ['full', 'basic'],
      default: 'full',
    },

    status: {
      type: String,
      enum: ['generated', 'edited', 'used_in_resume'],
      default: 'generated',
    },
  },
  { timestamps: true }
);

// Compound index for efficient user listing
JDResumePointsSchema.index({ userId: 1, createdAt: -1 });

const JDResumePoints =
  mongoose.models.JDResumePoints || mongoose.model('JDResumePoints', JDResumePointsSchema);

export default JDResumePoints;
