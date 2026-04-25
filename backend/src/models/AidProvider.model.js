import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    type: { type: String, enum: ['ngo', 'bank', 'government', 'private'], required: true },
    registrationNumber: String,
    contactPerson: String,
    phone: String,
    address: String,
    district: String,
    website: String,
    description: String,
    isVerified: { type: Boolean, default: false },
    verificationReviewedAt: Date,
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('AidProvider', providerSchema);
