import mongoose from 'mongoose';

const outreachTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  name: String, // user-given name: "Startup cold email"
  messageType: String,
  baseMessage: String, // the template text
  variables: [String], // ['{{company}}', '{{role}}', '{{hook}}']
  
  usageCount: { type: Number, default: 0 },
  
  abTest: {
    isActive: { type: Boolean, default: false },
    variantA: String,
    variantB: String,
    variantAStats: {
      sent: { type: Number, default: 0 },
      replies: { type: Number, default: 0 }
    },
    variantBStats: {
      sent: { type: Number, default: 0 },
      replies: { type: Number, default: 0 }
    }
  },
  
  replyRate: { type: Number, default: null } // replies/sent * 100
}, { timestamps: true });

export default mongoose.models.OutreachTemplate || mongoose.model('OutreachTemplate', outreachTemplateSchema);
