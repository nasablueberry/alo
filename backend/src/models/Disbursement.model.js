import mongoose from 'mongoose';

const disbursementSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    amount: { type: Number, required: true, min: 0 },
    releaseDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['bank', 'bkash', 'nagad', 'rocket', 'cash'], required: true },
    transactionReference: String,
    status: { type: String, enum: ['scheduled', 'released', 'failed'], default: 'released' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    periodStart: Date,
    periodEnd: Date,
  },
  { timestamps: true }
);

disbursementSchema.index({ application: 1 });
disbursementSchema.index({ student: 1, releaseDate: 1 });
disbursementSchema.index({ program: 1 });

export default mongoose.model('Disbursement', disbursementSchema);
