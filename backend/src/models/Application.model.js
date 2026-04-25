import mongoose from 'mongoose';

const paymentPreferenceSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['bkash', 'nagad', 'rocket', 'bank'] },
    mobileNumber: String,
    accountName: String,
    accountNumber: String,
    bankName: String,
    branch: String,
    routingNumber: String,
  },
  { _id: false }
);

const applicationDocumentSchema = new mongoose.Schema(
  {
    label: String,
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
    /** draft = student still editing; submitted = visible to provider for review */
    submissionStatus: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: Date,
    capabilityStatement: String,
    applicationDocuments: [applicationDocumentSchema],
    paymentPreference: paymentPreferenceSchema,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    eligibilityChecked: { type: Boolean, default: false },
    eligibilityPassed: Boolean,
    eligibilityNotes: String,
    rankScore: { type: Number, default: 0 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String,
    duplicateConflictWarning: { type: Boolean, default: false },
    duplicateConflictNotes: String,
    /** Admin fraud review: unreviewed | confirmed_fraud | cleared */
    fraudReviewStatus: {
      type: String,
      enum: ['unreviewed', 'confirmed_fraud', 'cleared'],
      default: 'unreviewed',
    },
    fraudReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fraudReviewedAt: Date,
    fraudReviewNote: String,
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, program: 1 }, { unique: true });
applicationSchema.index({ program: 1, status: 1 });
applicationSchema.index({ student: 1, status: 1 });

export default mongoose.model('Application', applicationSchema);
