import mongoose from 'mongoose';

const CompanyProfileSchema = new mongoose.Schema(
  {
    companySlug: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    cachedReport: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
    },
    fetchCount: {
      type: Number,
      default: 1,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
    exaSourceUrls: [{ type: String }],
    dataFreshness: { type: String },
    confidenceScore: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation on hot reload in development
const CompanyProfile =
  mongoose.models.CompanyProfile ||
  mongoose.model('CompanyProfile', CompanyProfileSchema);

export default CompanyProfile;
