import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      select: false, // Never returned by default in queries
    },
    avatar: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: '',
    },

    // ─── Onboarding Data ──────────────────────────────────────────────────
    currentStatus: {
      type: String,
      enum: ['student', 'fresher', 'working', 'switcher', ''],
      default: '',
    },
    targetRole: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['0-1yr', '1-3yr', '3-5yr', '5yr+', ''],
      default: '',
    },
    preferredLocation: {
      type: String,
      default: '',
    },
    location: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    
    education: {
      degree: { type: String, default: '' },
      fieldOfStudy: { type: String, default: '' },
      college: { type: String, default: '' },
      graduationYear: { type: Number }
    },
    
    jobPreferences: {
      jobType: [{ type: String }],
      workMode: [{ type: String }],
      preferredCities: [{ type: String }],
      expectedCTC: { type: String, default: '' },
      openToRelocate: { type: Boolean, default: false }
    },
    
    notifications: {
      platformUpdates: { type: Boolean, default: true },
      roadmapReminders: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      interviewReminders: { type: Boolean, default: false },
      newFeatures: { type: Boolean, default: true }
    },
    
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    skills: {
      technical: [{ type: String, trim: true }],
      soft: [{ type: String, trim: true }]
    },

    // ─── Profile Completeness ─────────────────────────────────────────────
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    profileScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ─── Saved Data ───────────────────────────────────────────────────────
    savedJobs: [{ type: String }],
    completedModules: [{ type: String }],

    // ─── AI Usage Tracking ────────────────────────────────────────────────
    aiUsage: {
      date: { type: String, default: '' },
      enhanceCount: { type: Number, default: 0 },
      atsCount: { type: Number, default: 0 },
      tailorCount: { type: Number, default: 0 },
    },

    // ─── Company Research Tracking ────────────────────────────────────────
    recentCompanySearches: [
      {
        companyName: String,
        companySlug: String,
        role: String,
        searchedAt: { type: Date, default: Date.now },
      }
    ],

    // ─── Timestamps ───────────────────────────────────────────────────────
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

// ─── Pre-Save Hook: Hash password before saving ───────────────────────────────
UserSchema.pre('save', async function () {
  // Only hash if the passwordHash field was actually modified
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

// ─── Instance Method: Compare plain password with stored hash ─────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Instance Method: Return user object without sensitive fields ──────────────
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

// ─── Pre-Find Hook: Filter Soft Deleted Users ────────────────────────────────
UserSchema.pre(/^find/, function (next) {
  this.where({ deleted: { $ne: true } });
  next();
});

// ─── Helper: Calculate Profile Score ─────────────────────────────────────────
UserSchema.methods.calculateProfileScore = function () {
  let score = 0;
  if (this.name) score += 10;
  if (this.email) score += 10;
  if (this.targetRole) score += 15;
  if (this.experienceLevel) score += 10;
  if (this.location || this.preferredLocation) score += 10;
  if (this.education && this.education.degree) score += 10;
  if (this.bio) score += 10;
  if (this.linkedinUrl) score += 5;
  if (this.githubUrl) score += 5;
  if (this.skills && (this.skills.technical?.length > 0 || this.skills.soft?.length > 0)) score += 15;

  this.profileScore = Math.min(score, 100);
  return this.profileScore;
};

// Prevent model recompilation on hot reload in development
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
