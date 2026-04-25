import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'AidProvider', required: true },
    title: { type: String, required: true },
    description: String,
    totalFund: { type: Number, required: true, min: 0 },
    remainingFund: { type: Number, required: true, min: 0 },
    amountPerBeneficiary: { type: Number, required: true, min: 0 },
    maxBeneficiaries: { type: Number, required: true, min: 1 },
    currentBeneficiaries: { type: Number, default: 0 },
    eligibilityCriteria: {
      minCgpa: { type: Number, min: 0, max: 4 },
      maxIncome: { type: Number },
      minAttendance: { type: Number, min: 0, max: 100 },
      allowedDistricts: [String],
      allowedInstitutionTypes: [String],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true },
    status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' },
    durationMonths: { type: Number, default: 12 },
  },
  { timestamps: true }
);

programSchema.index({ provider: 1, status: 1 });
programSchema.index({ status: 1, applicationDeadline: 1 });

export default mongoose.model('ScholarshipProgram', programSchema);
