import mongoose from 'mongoose';

const SavedCompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companySlug: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
    },
    savedRole: {
      type: String,
    },
    notes: {
      type: String,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate saves per user
SavedCompanySchema.index({ userId: 1, companySlug: 1 }, { unique: true });

// Prevent model recompilation on hot reload in development
const SavedCompany =
  mongoose.models.SavedCompany ||
  mongoose.model('SavedCompany', SavedCompanySchema);

export default SavedCompany;
