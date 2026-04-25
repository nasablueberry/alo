import StudentProfile from '../models/StudentProfile.model.js';
import StudentWithdrawal from '../models/StudentWithdrawal.model.js';
import Application from '../models/Application.model.js';
import { updateStudentFinancialNeedScore } from '../services/financialNeedScore.service.js';
import { createAuditLog } from '../utils/auditLog.js';

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const allowed = [
      'fullName', 'phone', 'dateOfBirth', 'gender',
      'district', 'upazila',
      'institutionName', 'institutionType',
      'householdIncome', 'familySize',
      'attendancePercentage', 'cgpa',
    ];
    const previousName = profile.fullName;

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) profile[key] = req.body[key];
    });
    if (req.body.cgpaHistory) profile.cgpaHistory = req.body.cgpaHistory;

    await profile.save();

    // Recalculate and persist the financial need score immediately
    await updateStudentFinancialNeedScore(profile._id);

    // Re-fetch so the response contains the freshly computed score
    const fresh = await StudentProfile.findById(profile._id).populate('user', 'email').lean();

    // If the student's name changed, update it on all their Applications (denormalised field)
    // so providers and admins see the current name without a separate populate.
    if (req.body.fullName && req.body.fullName !== previousName) {
      await Application.updateMany(
        { student: profile._id },
        { $set: { 'studentSnapshot.fullName': req.body.fullName } }
      ).catch(() => {/* non-critical — Applications use populate('student') anyway */});
    }

    await createAuditLog({
      userId: req.user._id,
      action: 'update',
      resource: 'StudentProfile',
      resourceId: profile._id,
      details: { updatedFields: allowed.filter((k) => req.body[k] !== undefined) },
      req,
    });

    res.json(fresh);
  } catch (err) {
    next(err);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const type = req.body.type || 'identification';
    profile.documents.push({
      type,
      url: '/uploads/' + req.file.filename,
      verified: false,
    });
    await profile.save();

    // Recalculate score — new docs may increase the completeness bonus once verified
    await updateStudentFinancialNeedScore(profile._id);

    await createAuditLog({
      userId: req.user._id,
      action: 'document_upload',
      resource: 'StudentProfile',
      resourceId: profile._id,
      details: { type },
      req,
    });

    const fresh = await StudentProfile.findById(profile._id).populate('user', 'email').lean();
    res.json(fresh);
  } catch (err) {
    next(err);
  }
};

export const getScholarshipHistory = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const Disbursement = (await import('../models/Disbursement.model.js')).default;
    const Application = (await import('../models/Application.model.js')).default;

    const applications = await Application.find({ student: profile._id })
      .populate('program', 'title amountPerBeneficiary durationMonths')
      .sort({ createdAt: -1 })
      .lean();

    const disbursements = await Disbursement.find({ student: profile._id })
      .populate('program', 'title')
      .sort({ releaseDate: -1 })
      .lean();

    res.json({ applications, disbursements });
  } catch (err) {
    next(err);
  }
};

export const listMyWithdrawals = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const withdrawals = await StudentWithdrawal.find({ student: profile._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};

export const createWithdrawal = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const { amount, method, mobileNumber, bankName, accountName, accountNumber, branch, routingNumber } = req.body;
    const methods = ['bkash', 'nagad', 'rocket', 'bank'];
    if (!method || !methods.includes(method)) {
      return res.status(400).json({ message: 'Choose a valid withdrawal method: bKash, Nagad, Rocket, or bank transfer.' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) {
      return res.status(400).json({ message: 'Enter a valid amount of at least ৳1.' });
    }
    const balance = Number(profile.accountBalance) || 0;
    if (amt > balance) {
      return res.status(400).json({ message: 'Amount exceeds your available account balance.' });
    }

    if (['bkash', 'nagad', 'rocket'].includes(method)) {
      const m = String(mobileNumber || '').replace(/\D/g, '');
      if (m.length < 10 || m.length > 11) {
        return res.status(400).json({ message: 'Enter a valid mobile number for the selected wallet (10–11 digits).' });
      }
    } else {
      const bn = String(bankName || '').trim();
      const an = String(accountName || '').trim();
      const ac = String(accountNumber || '').trim();
      if (!bn || !an || !ac) {
        return res.status(400).json({ message: 'Enter bank name, account name, and account number for bank transfer.' });
      }
    }

    const withdrawal = await StudentWithdrawal.create({
      student: profile._id,
      amount: amt,
      method,
      mobileNumber: ['bkash', 'nagad', 'rocket'].includes(method) ? String(mobileNumber || '').replace(/\D/g, '') : undefined,
      bankName: method === 'bank' ? String(bankName).trim() : undefined,
      accountName: method === 'bank' ? String(accountName).trim() : undefined,
      accountNumber: method === 'bank' ? String(accountNumber).trim() : undefined,
      branch: method === 'bank' && branch ? String(branch).trim() : undefined,
      routingNumber: method === 'bank' && routingNumber ? String(routingNumber).trim() : undefined,
      status: 'pending',
    });

    await StudentProfile.findByIdAndUpdate(profile._id, { $inc: { accountBalance: -amt } });
    await createAuditLog({
      userId: req.user._id,
      action: 'student_withdrawal',
      resource: 'StudentWithdrawal',
      resourceId: withdrawal._id,
      details: { amount: amt, method },
      req,
    });
    res.status(201).json(withdrawal);
  } catch (err) {
    next(err);
  }
};
