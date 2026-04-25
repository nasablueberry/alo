import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: { type: String, enum: ['transcript', 'income_proof', 'identification', 'birth_certificate'], required: true },
  url: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
}, { _id: true });

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    birthCertificateId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    district: { type: String, required: true },
    upazila: { type: String, required: true },
    institutionName: { type: String, required: true },
    institutionType: { type: String, enum: ['school', 'college', 'university'] },
    householdIncome: { type: Number, required: true },
    familySize: { type: Number, default: 1 },
    attendancePercentage: { type: Number, min: 0, max: 100, default: 0 },
    cgpa: { type: Number, min: 0, max: 4, default: 0 },
    cgpaHistory: [{ value: Number, semester: String, recordedAt: Date }],
    documents: [documentSchema],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'unverified'],
      default: 'pending',
    },
    verificationReviewedAt: Date,
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Total BDT credited from released disbursements (maintained by admin disbursement) */
    accountBalance: { type: Number, default: 0, min: 0 },
    financialNeedScore: { type: Number, default: 0 },
    lastNeedScoreUpdate: Date,
    isAtRisk: { type: Boolean, default: false },
    atRiskReason: String,
  },
  { timestamps: true }
);

studentSchema.index({ birthCertificateId: 1 });
studentSchema.index({ district: 1, upazila: 1 });
studentSchema.index({ verificationStatus: 1 });
studentSchema.index({ cgpa: 1, attendancePercentage: 1 });

export default mongoose.model('StudentProfile', studentSchema);
