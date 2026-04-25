import mongoose from 'mongoose';

const studentWithdrawalSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['bkash', 'nagad', 'rocket', 'bank'], required: true },
    mobileNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    transactionReference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

studentWithdrawalSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('StudentWithdrawal', studentWithdrawalSchema);
