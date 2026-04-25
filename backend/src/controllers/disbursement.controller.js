import Disbursement from '../models/Disbursement.model.js';
import Application from '../models/Application.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AidProvider from '../models/AidProvider.model.js';
import { createAuditLog } from '../utils/auditLog.js';
import { notifyDisbursement } from '../services/notification.service.js';

export const create = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const { applicationId, amount, releaseDate, paymentMethod, transactionReference, periodStart, periodEnd } = req.body;
    const application = await Application.findById(applicationId).populate('program');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'approved') return res.status(400).json({ message: 'Only approved applications can have disbursements' });
    if (application.program.provider.toString() !== provider._id.toString()) return res.status(403).json({ message: 'Not your program' });

    const program = await ScholarshipProgram.findById(application.program._id);
    const amt = Number(amount) || program.amountPerBeneficiary;
    if (program.remainingFund < amt) return res.status(400).json({ message: 'Insufficient program fund balance' });

    const disbursement = await Disbursement.create({
      application: application._id,
      program: program._id,
      student: application.student,
      amount: amt,
      releaseDate: releaseDate || new Date(),
      paymentMethod: paymentMethod || 'bank',
      transactionReference,
      periodStart,
      periodEnd,
      recordedBy: req.user._id,
    });

    await ScholarshipProgram.findByIdAndUpdate(program._id, { $inc: { remainingFund: -amt } });
    await StudentProfile.findByIdAndUpdate(application.student, { $inc: { accountBalance: amt } });
    const studentProfile = await StudentProfile.findById(application.student).select('user');
    if (studentProfile?.user) {
      await notifyDisbursement(studentProfile.user, amt, paymentMethod || 'bank', transactionReference);
    }
    await createAuditLog({ userId: req.user._id, action: 'disbursement', resource: 'Disbursement', resourceId: disbursement._id, details: { amount: amt }, req });
    res.status(201).json(disbursement);
  } catch (err) {
    next(err);
  }
};

export const listByProgram = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
    const program = await ScholarshipProgram.findOne({ _id: req.params.programId, provider: provider._id });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const disbursements = await Disbursement.find({ program: program._id })
      .populate('student', 'fullName district upazila')
      .sort({ releaseDate: -1 });
    res.json(disbursements);
  } catch (err) {
    next(err);
  }
};
