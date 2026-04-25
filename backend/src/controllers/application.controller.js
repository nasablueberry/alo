import mongoose from 'mongoose';
import Application from '../models/Application.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import AidProvider from '../models/AidProvider.model.js';
import { checkEligibility } from '../services/eligibility.service.js';
import { checkDuplicateAid } from '../services/duplicateDetection.service.js';
import { createAuditLog } from '../utils/auditLog.js';
import { createAndSendNotification, notifyApplicationUpdate } from '../services/notification.service.js';
import { rankApplicantsForProgram } from '../services/applicantRanking.service.js';
import { buildSubmittedToProviderFilter } from '../constants/applicationFilters.js';

function canStudentEditApplication(app) {
  if (!app) return false;
  if (app.submissionStatus === 'draft') return true;
  if (app.submissionStatus === 'submitted' && app.status === 'pending') return true;
  return false;
}

/** Legacy rows have no submissionStatus — treat as submitted for provider/admin views */
export const isVisibleToProvider = (app) =>
  app.submissionStatus === 'submitted' ||
  app.submissionStatus === undefined ||
  app.submissionStatus === null;

export const startApplication = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const { programId } = req.body;
    if (!programId || !mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: 'Invalid program id' });
    }
    const programObjectId = new mongoose.Types.ObjectId(String(programId));
    const program = await ScholarshipProgram.findById(programObjectId);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    if (program.status !== 'active') return res.status(400).json({ message: 'Program is not accepting applications' });
    const ddl = new Date(program.applicationDeadline);
    const deadlineEnd = new Date(ddl.getFullYear(), ddl.getMonth(), ddl.getDate(), 23, 59, 59, 999);
    if (new Date() > deadlineEnd) return res.status(400).json({ message: 'Application deadline passed' });

    const existing = await Application.findOne({ student: studentProfile._id, program: programObjectId });
    if (existing) return res.status(200).json(existing);

    const eligibility = await checkEligibility(studentProfile._id, programId);
    const duplicate = await checkDuplicateAid(studentProfile._id, programId);

    try {
      const application = await Application.create({
        student: studentProfile._id,
        program: programObjectId,
        submissionStatus: 'draft',
        eligibilityChecked: true,
        eligibilityPassed: eligibility.eligible,
        eligibilityNotes: eligibility.notes,
        duplicateConflictWarning: duplicate.hasConflict,
        duplicateConflictNotes: duplicate.message,
      });
      await createAuditLog({ userId: req.user._id, action: 'application_start', resource: 'Application', resourceId: application._id, req });
      return res.status(201).json(application);
    } catch (err) {
      if (err && err.code === 11000) {
        const again = await Application.findOne({ student: studentProfile._id, program: programObjectId });
        if (again) return res.status(200).json(again);
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const updateDraft = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const application = await Application.findOne({ _id: req.params.id, student: studentProfile._id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (!canStudentEditApplication(application)) {
      return res.status(400).json({ message: 'This application can no longer be edited' });
    }

    const { capabilityStatement, paymentPreference } = req.body;
    if (capabilityStatement !== undefined) application.capabilityStatement = capabilityStatement;
    if (paymentPreference !== undefined) {
      const prev = application.paymentPreference;
      const plain =
        prev && typeof prev.toObject === 'function' ? prev.toObject() : prev ? { ...prev } : {};
      application.paymentPreference = { ...plain, ...paymentPreference };
    }
    await application.save();
    await createAuditLog({ userId: req.user._id, action: 'application_draft_update', resource: 'Application', resourceId: application._id, req });
    res.json(application);
  } catch (err) {
    next(err);
  }
};

export const uploadApplicationDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const application = await Application.findOne({ _id: req.params.id, student: studentProfile._id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (!canStudentEditApplication(application)) {
      return res.status(400).json({ message: 'You cannot add documents to this application in its current state' });
    }

    const label = req.body.label || req.file.originalname || 'Document';
    application.applicationDocuments = application.applicationDocuments || [];
    application.applicationDocuments.push({
      label,
      url: '/uploads/' + req.file.filename,
      uploadedAt: new Date(),
    });
    await application.save();
    await createAuditLog({ userId: req.user._id, action: 'application_document', resource: 'Application', resourceId: application._id, req });
    res.json(application);
  } catch (err) {
    next(err);
  }
};

export const submitApplication = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const application = await Application.findOne({ _id: req.params.id, student: studentProfile._id }).populate('program');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.submissionStatus !== 'draft') {
      return res.status(400).json({ message: 'Application already submitted' });
    }

    const stmt = (application.capabilityStatement || '').trim();
    if (stmt.length < 30) {
      return res.status(400).json({ message: 'Please write at least a few sentences explaining why you are a strong candidate (min. 30 characters).' });
    }
    const method = application.paymentPreference?.method;
    if (!method || !['bkash', 'nagad', 'rocket', 'bank'].includes(method)) {
      return res.status(400).json({ message: 'Choose how you wish to receive funds (bKash, Nagad, Rocket, or bank).' });
    }
    if (['bkash', 'nagad', 'rocket'].includes(method)) {
      const m = (application.paymentPreference?.mobileNumber || '').trim();
      if (m.length < 10) return res.status(400).json({ message: 'Enter a valid mobile wallet number.' });
    }
    if (method === 'bank') {
      const acc = (application.paymentPreference?.accountNumber || '').trim();
      const bank = (application.paymentPreference?.bankName || '').trim();
      if (!acc || !bank) return res.status(400).json({ message: 'Enter bank name and account details for transfer.' });
    }
    if (!application.applicationDocuments?.length) {
      return res.status(400).json({ message: 'Upload at least one supporting document.' });
    }

    application.submissionStatus = 'submitted';
    application.submittedAt = new Date();
    await application.save();

    const programDoc =
      application.program && typeof application.program === 'object' && application.program.title
        ? application.program
        : await ScholarshipProgram.findById(application.program?._id || application.program).select('title provider');
    const programTitle = programDoc?.title || 'Scholarship program';

    try {
      if (application.eligibilityPassed) {
        const pid = programDoc?._id || application.program?._id || application.program;
        if (pid) await rankApplicantsForProgram(pid);
      }
    } catch (err) {
      console.error('rankApplicantsForProgram after submit:', err);
    }

    try {
      await createAndSendNotification({
        userId: req.user._id,
        title: 'Application submitted',
        message: `Your application for "${programTitle}" has been submitted. The provider will review it when ready.`,
        type: 'application',
        relatedId: application._id,
        relatedType: 'application',
        sendEmailAlert: true,
      });
    } catch (err) {
      console.error('student notification after submit:', err);
    }

    try {
      const provId = programDoc?.provider;
      if (provId) {
        const aid = await AidProvider.findById(provId).select('user');
        if (aid?.user) {
          await createAndSendNotification({
            userId: aid.user,
            title: 'New scholarship application',
            message: `A student submitted an application for "${programTitle}". Review it from your dashboard (Review applications on that program).`,
            type: 'application',
            relatedId: application._id,
            relatedType: 'application',
            sendEmailAlert: true,
          });
        }
      }
    } catch (err) {
      console.error('provider notification after submit:', err);
    }

    try {
      await createAuditLog({ userId: req.user._id, action: 'application_submit', resource: 'Application', resourceId: application._id, req });
    } catch (err) {
      console.error('audit log after submit:', err);
    }

    const fresh = await Application.findById(application._id).populate('program', 'title amountPerBeneficiary').lean();
    res.json(fresh || application);
  } catch (err) {
    next(err);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const applications = await Application.find({ student: profile._id })
      .populate('program', 'title amountPerBeneficiary status applicationDeadline')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const app = await Application.findOne({ _id: req.params.id, student: profile._id }).populate('program');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    next(err);
  }
};

export const getByProgram = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
    const program = await ScholarshipProgram.findOne({ _id: req.params.programId, provider: provider._id });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const { status } = req.query;
    const query = { program: program._id, ...buildSubmittedToProviderFilter() };
    if (status) query.status = status;
    const applications = await Application.find(query)
      .populate(
        'student',
        'fullName cgpa attendancePercentage householdIncome financialNeedScore district upazila verificationStatus documents'
      )
      .sort({ rankScore: -1, createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

/** All applications this provider (across their programs) has rejected. */
export const getProviderRejections = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
    const programIds = await ScholarshipProgram.find({ provider: provider._id }).distinct('_id');
    if (!programIds.length) return res.json([]);

    const applications = await Application.find({
      program: { $in: programIds },
      status: 'rejected',
    })
      .populate('student', 'fullName district upazila birthCertificateId')
      .populate('program', 'title applicationDeadline')
      .sort({ reviewedAt: -1, updatedAt: -1 })
      .lean();
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

export const approveOrReject = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const application = await Application.findById(req.params.id).populate('program').populate('student');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.program.provider.toString() !== provider._id.toString()) return res.status(403).json({ message: 'Not your program' });
    if (!isVisibleToProvider(application)) {
      return res.status(400).json({ message: 'This application is still a draft' });
    }
    if (application.status !== 'pending') return res.status(400).json({ message: 'Application already processed' });

    const { action, rejectionReason } = req.body;
    if (action === 'reject') {
      application.status = 'rejected';
      application.rejectionReason = rejectionReason;
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      await application.save();
      const studentUser = (await StudentProfile.findById(application.student._id).select('user')).user;
      await notifyApplicationUpdate(application, 'rejected', studentUser, { reason: rejectionReason });
    } else {
      const duplicate = await checkDuplicateAid(application.student._id, application.program._id);
      if (duplicate.hasConflict) {
        return res.status(400).json({ message: 'Duplicate aid conflict. Cannot approve.', conflict: duplicate });
      }
      application.status = 'approved';
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      await application.save();
      await ScholarshipProgram.findByIdAndUpdate(application.program._id, { $inc: { currentBeneficiaries: 1 } });
      const studentUser = (await StudentProfile.findById(application.student._id).select('user')).user;
      await notifyApplicationUpdate(application, 'approved', studentUser, { amount: application.program.amountPerBeneficiary });
    }
    await createAuditLog({ userId: req.user._id, action: action === 'approve' ? 'approve' : 'reject', resource: 'Application', resourceId: application._id, req });
    res.json(application);
  } catch (err) {
    next(err);
  }
};

export const checkEligibilityForProgram = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const result = await checkEligibility(profile._id, req.params.programId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
