import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AidProvider from '../models/AidProvider.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import Application from '../models/Application.model.js';
import Disbursement from '../models/Disbursement.model.js';
import AuditLog from '../models/AuditLog.model.js';
import { createAuditLog } from '../utils/auditLog.js';
import { identifyAtRiskStudents } from '../services/dropoutRisk.service.js';
import { updateStudentFinancialNeedScore } from '../services/financialNeedScore.service.js';
import { buildSubmittedToProviderFilter } from '../constants/applicationFilters.js';
import { notifyDisbursement } from '../services/notification.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const [totalStudents, totalProviders, activePrograms, pendingApplications, totalDisbursedToday, auditRecent] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'provider' }),
      ScholarshipProgram.countDocuments({ status: 'active' }),
      Application.countDocuments({ status: 'pending' }),
      Disbursement.aggregate([
        { $match: { releaseDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'released' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then((r) => r[0]?.total ?? 0),
      AuditLog.find().sort({ createdAt: -1 }).limit(50).populate('user', 'email role').lean(),
    ]);

    const totalFundUtilized = await Disbursement.aggregate([
      { $match: { status: 'released' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total ?? 0);

    res.json({
      totalStudents,
      totalProviders,
      activePrograms,
      pendingApplications,
      totalDisbursedToday,
      totalFundUtilized,
      recentAudit: auditRecent,
    });
  } catch (err) {
    next(err);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const { district, upazila, verificationStatus, atRisk, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (district) query.district = new RegExp(district, 'i');
    if (upazila) query.upazila = new RegExp(upazila, 'i');
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (atRisk === 'true') query.isAtRisk = true;
    if (search && search.trim()) {
      const s = search.trim();
      const userIds = await User.find({
        role: 'student',
        $or: [
          { email: new RegExp(s, 'i') },
        ],
      }).distinct('_id');
      query.$or = [
        { fullName: new RegExp(s, 'i') },
        { birthCertificateId: new RegExp(s, 'i') },
        { district: new RegExp(s, 'i') },
        { upazila: new RegExp(s, 'i') },
        { institutionName: new RegExp(s, 'i') },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }
    const students = await StudentProfile.find(query)
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await StudentProfile.countDocuments(query);
    res.json({ students, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await StudentProfile.findById(req.params.id).populate('user', 'email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const { email, password, birthCertificateId, fullName, phone, dateOfBirth, gender, district, upazila, institutionName, institutionType, householdIncome, familySize, attendancePercentage, cgpa, verificationStatus } = req.body;
    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    const existingBirth = await StudentProfile.findOne({ birthCertificateId });
    if (existingBirth) return res.status(400).json({ message: 'Birth Certificate ID already registered' });
    const user = await User.create({ email: email.toLowerCase(), password: password || 'Password123', role: 'student', isActive: true });
    const student = await StudentProfile.create({
      user: user._id,
      birthCertificateId,
      fullName,
      phone: phone || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || undefined,
      district,
      upazila,
      institutionName,
      institutionType: institutionType || 'school',
      householdIncome: Number(householdIncome) || 0,
      familySize: Number(familySize) || 1,
      attendancePercentage: Number(attendancePercentage) ?? 0,
      cgpa: Number(cgpa) ?? 0,
      verificationStatus: verificationStatus || 'pending',
    });
    await updateStudentFinancialNeedScore(student._id);
    await createAuditLog({ userId: req.user._id, action: 'create_student', resource: 'StudentProfile', resourceId: student._id, details: { email }, req });
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await StudentProfile.findById(req.params.id).populate('user', 'email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { email, password, birthCertificateId, fullName, phone, dateOfBirth, gender, district, upazila, institutionName, institutionType, householdIncome, familySize, attendancePercentage, cgpa, verificationStatus } = req.body;
    const prevVerification = student.verificationStatus;
    const allowed = ['birthCertificateId', 'fullName', 'phone', 'dateOfBirth', 'gender', 'district', 'upazila', 'institutionName', 'institutionType', 'householdIncome', 'familySize', 'attendancePercentage', 'cgpa', 'verificationStatus'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'dateOfBirth') student[key] = req.body[key] ? new Date(req.body[key]) : undefined;
        else if (key === 'householdIncome' || key === 'familySize' || key === 'attendancePercentage' || key === 'cgpa') student[key] = Number(req.body[key]);
        else student[key] = req.body[key];
      }
    }
    if (req.body.verificationStatus !== undefined && req.body.verificationStatus !== prevVerification) {
      student.verificationReviewedAt = new Date();
      student.verificationReviewedBy = req.user._id;
    }
    await student.save();
    if (email && email !== student.user?.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      await User.findByIdAndUpdate(student.user._id, { email: email.toLowerCase() });
    }
    if (password && password.length >= 6) {
      const hashed = await bcrypt.hash(password, 12);
      await User.findByIdAndUpdate(student.user._id, { password: hashed });
    }
    await updateStudentFinancialNeedScore(student._id);
    await createAuditLog({ userId: req.user._id, action: 'update_student', resource: 'StudentProfile', resourceId: student._id, req });
    const updated = await StudentProfile.findById(student._id).populate('user', 'email');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const listProviders = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { organizationName: new RegExp(s, 'i') },
        { type: new RegExp(s, 'i') },
        { district: new RegExp(s, 'i') },
        { contactPerson: new RegExp(s, 'i') },
      ];
    }
    const providers = await AidProvider.find(query)
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await AidProvider.countDocuments(query);
    res.json({ providers, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getProvider = async (req, res, next) => {
  try {
    const provider = await AidProvider.findById(req.params.id).populate('user', 'email');
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const programs = await ScholarshipProgram.find({ provider: provider._id }).lean();
    const data = provider.toObject ? provider.toObject() : provider;
    res.json({ ...data, programs });
  } catch (err) {
    next(err);
  }
};

export const updateProviderByAdmin = async (req, res, next) => {
  try {
    const provider = await AidProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const allowed = [
      'organizationName',
      'type',
      'registrationNumber',
      'contactPerson',
      'phone',
      'address',
      'district',
      'website',
      'description',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) provider[key] = req.body[key];
    }
    await provider.save();
    await createAuditLog({
      userId: req.user._id,
      action: 'update',
      resource: 'AidProvider',
      resourceId: provider._id,
      req,
    });
    const fresh = await AidProvider.findById(provider._id).populate('user', 'email');
    const programs = await ScholarshipProgram.find({ provider: provider._id }).lean();
    res.json({ ...(fresh.toObject ? fresh.toObject() : fresh), programs });
  } catch (err) {
    next(err);
  }
};

export const updateProviderVerification = async (req, res, next) => {
  try {
    const { providerId, isVerified } = req.body;
    const provider = await AidProvider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ message: 'isVerified must be boolean' });
    }
    provider.isVerified = isVerified;
    provider.verificationReviewedAt = new Date();
    provider.verificationReviewedBy = req.user._id;
    await provider.save();
    await createAuditLog({
      userId: req.user._id,
      action: 'verify_provider',
      resource: 'AidProvider',
      resourceId: provider._id,
      details: { isVerified },
      req,
    });
    res.json(provider);
  } catch (err) {
    next(err);
  }
};

export const verifyStudentDocuments = async (req, res, next) => {
  try {
    const { studentId, status } = req.body;
    const student = await StudentProfile.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!['verified', 'rejected', 'pending', 'unverified'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    student.verificationStatus = status;
    student.verificationReviewedAt = new Date();
    student.verificationReviewedBy = req.user._id;
    await student.save();

    // Recalculate score — verified docs contribute 10% bonus weight
    await updateStudentFinancialNeedScore(student._id);

    await createAuditLog({ userId: req.user._id, action: 'verify_student', resource: 'StudentProfile', resourceId: student._id, details: { status }, req });

    const fresh = await StudentProfile.findById(student._id).populate('user', 'email').lean();
    res.json(fresh);
  } catch (err) {
    next(err);
  }
};

export const runAtRiskIdentification = async (req, res, next) => {
  try {
    const count = await identifyAtRiskStudents();
    await createAuditLog({ userId: req.user._id, action: 'run_at_risk_identification', resource: 'system', details: { count }, req });
    res.json({ message: 'At-risk identification completed', atRiskCount: count });
  } catch (err) {
    next(err);
  }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, userId, page = 1, limit = 50, from, to } = req.query;
    const query = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (userId) query.user = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const logs = await AuditLog.find(query)
      .populate('user', 'email role')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await AuditLog.countDocuments(query);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const listApplicationsPendingDisbursement = async (req, res, next) => {
  try {
    const disbursedIds = await Disbursement.distinct('application');
    const apps = await Application.find({
      status: 'approved',
      ...buildSubmittedToProviderFilter(),
      _id: { $nin: disbursedIds },
    })
      .populate('program', 'title amountPerBeneficiary remainingFund')
      .populate('student', 'fullName birthCertificateId district upazila phone')
      .sort({ reviewedAt: -1 })
      .lean();
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

export const createAdminDisbursement = async (req, res, next) => {
  try {
    const { applicationId, amount, releaseDate, paymentMethod, transactionReference, periodStart, periodEnd } = req.body;
    const application = await Application.findById(applicationId).populate('program');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'approved') return res.status(400).json({ message: 'Only approved applications can be disbursed' });

    const existing = await Disbursement.findOne({ application: application._id });
    if (existing) return res.status(400).json({ message: 'Disbursement already recorded for this application' });

    const program = await ScholarshipProgram.findById(application.program._id);
    const amt = Number(amount) || program.amountPerBeneficiary;
    if (program.remainingFund < amt) return res.status(400).json({ message: 'Insufficient program fund balance' });

    let method = paymentMethod;
    if (!method && application.paymentPreference?.method) {
      method = application.paymentPreference.method;
    }
    if (!method) method = 'bank';
    const allowedMethods = ['bank', 'bkash', 'nagad', 'rocket', 'cash'];
    if (!allowedMethods.includes(method)) return res.status(400).json({ message: 'Invalid payment method' });

    const disbursement = await Disbursement.create({
      application: application._id,
      program: program._id,
      student: application.student,
      amount: amt,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      paymentMethod: method,
      transactionReference,
      periodStart,
      periodEnd,
      recordedBy: req.user._id,
    });

    await ScholarshipProgram.findByIdAndUpdate(program._id, { $inc: { remainingFund: -amt } });
    await StudentProfile.findByIdAndUpdate(application.student, { $inc: { accountBalance: amt } });
    const studentProfile = await StudentProfile.findById(application.student).select('user');
    if (studentProfile?.user) {
      await notifyDisbursement(studentProfile.user, amt, method, transactionReference);
    }
    await createAuditLog({
      userId: req.user._id,
      action: 'disbursement',
      resource: 'Disbursement',
      resourceId: disbursement._id,
      details: { amount: amt, applicationId: String(application._id) },
      req,
    });
    res.status(201).json(disbursement);
  } catch (err) {
    next(err);
  }
};

/** Application rejections (any provider) + students rejected at profile verification. */
export const getAdminRejections = async (req, res, next) => {
  try {
    const [applicationRejections, profileRejections] = await Promise.all([
      Application.find({ status: 'rejected' })
        .populate('student', 'fullName district upazila birthCertificateId')
        .populate({ path: 'program', select: 'title', populate: { path: 'provider', select: 'organizationName type' } })
        .sort({ reviewedAt: -1, updatedAt: -1 })
        .limit(200)
        .lean(),
      StudentProfile.find({ verificationStatus: 'rejected' })
        .populate('user', 'email')
        .sort({ verificationReviewedAt: -1, updatedAt: -1 })
        .limit(200)
        .lean(),
    ]);
    res.json({ applicationRejections, profileRejections });
  } catch (err) {
    next(err);
  }
};

export const generateReport = async (req, res, next) => {
  try {
    const { format, type, programId, district, from, to } = req.query;
    const reportService = (await import('../services/report.service.js')).default;
    const result = await reportService.generate({ format: format || 'csv', type: type || 'disbursements', programId, district, from, to });
    if (result.contentType === 'application/json') return res.json(result.data);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (err) {
    next(err);
  }
};

/** List all applications flagged as potential duplicates/fraud. */
export const listFlaggedApplications = async (req, res, next) => {
  try {
    const apps = await Application.find({ duplicateConflictWarning: true })
      .populate('student', 'fullName district upazila birthCertificateId cgpa financialNeedScore')
      .populate({ path: 'program', select: 'title amountPerBeneficiary', populate: { path: 'provider', select: 'organizationName' } })
      .populate('fraudReviewedBy', 'email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

/** Admin confirms fraud or clears a false positive. */
export const reviewFraudFlag = async (req, res, next) => {
  try {
    const { action, note } = req.body;
    if (!['confirmed_fraud', 'cleared'].includes(action)) {
      return res.status(400).json({ message: 'action must be confirmed_fraud or cleared' });
    }

    const application = await Application.findById(req.params.id)
      .populate('student', 'fullName user')
      .populate('program', 'title provider');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (!application.duplicateConflictWarning) {
      return res.status(400).json({ message: 'This application is not flagged for duplicate conflict' });
    }

    application.fraudReviewStatus = action;
    application.fraudReviewedBy = req.user._id;
    application.fraudReviewedAt = new Date();
    application.fraudReviewNote = note?.trim() || undefined;

    if (action === 'confirmed_fraud') {
      application.status = 'rejected';
      application.rejectionReason = note?.trim() || 'Confirmed fraudulent duplicate aid application by admin.';
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
    }

    await application.save();

    // Notify the student
    try {
      const { createAndSendNotification } = await import('../services/notification.service.js');
      if (action === 'confirmed_fraud') {
        await createAndSendNotification({
          userId: application.student?.user,
          title: 'Application flagged as fraudulent',
          message: `Your application for "${application.program?.title}" has been flagged and rejected due to a duplicate aid conflict. Contact support if you believe this is an error.`,
          type: 'application',
          relatedId: application._id,
          relatedType: 'application',
          sendEmailAlert: true,
        });
      }
    } catch (notifErr) {
      console.error('fraud review notification error:', notifErr);
    }

    await createAuditLog({
      userId: req.user._id,
      action: action === 'confirmed_fraud' ? 'fraud_confirmed' : 'fraud_cleared',
      resource: 'Application',
      resourceId: application._id,
      details: { note, action },
      req,
    });

    const fresh = await Application.findById(application._id)
      .populate('student', 'fullName district upazila birthCertificateId cgpa financialNeedScore')
      .populate({ path: 'program', select: 'title amountPerBeneficiary', populate: { path: 'provider', select: 'organizationName' } })
      .populate('fraudReviewedBy', 'email')
      .lean();
    res.json(fresh);
  } catch (err) {
    next(err);
  }
};

