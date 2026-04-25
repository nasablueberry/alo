import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import AidProvider from '../models/AidProvider.model.js';
import { createAuditLog } from '../utils/auditLog.js';
import { rankApplicantsForProgram } from '../services/applicantRanking.service.js';

export const create = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const body = { ...req.body, provider: provider._id };
    body.remainingFund = body.totalFund;
    const program = await ScholarshipProgram.create(body);
    await createAuditLog({ userId: req.user._id, action: 'create', resource: 'ScholarshipProgram', resourceId: program._id, req });
    res.status(201).json(program);
  } catch (err) {
    next(err);
  }
};

export const getMyPrograms = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
    const programs = await ScholarshipProgram.find({ provider: provider._id }).sort({ createdAt: -1 });
    res.json(programs);
  } catch (err) {
    next(err);
  }
};

export const updateProgram = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const program = await ScholarshipProgram.findOne({ _id: req.params.id, provider: provider._id });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const allowed = ['title', 'description', 'amountPerBeneficiary', 'maxBeneficiaries', 'eligibilityCriteria', 'startDate', 'endDate', 'applicationDeadline', 'durationMonths', 'status'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) program[key] = req.body[key];
    });
    await program.save();
    await createAuditLog({ userId: req.user._id, action: 'update', resource: 'ScholarshipProgram', resourceId: program._id, req });
    res.json(program);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const program = await ScholarshipProgram.findById(req.params.id).populate('provider', 'organizationName type');
    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.json(program);
  } catch (err) {
    next(err);
  }
};

export const listPublic = async (req, res, next) => {
  try {
    const { district, status = 'active', page = 1, limit = 20 } = req.query;
    // Include programs whose deadline is still today or later (calendar day), not only "after this exact instant"
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const query = { status, applicationDeadline: { $gte: startOfToday } };
    if (district) query['eligibilityCriteria.allowedDistricts'] = district;
    const programs = await ScholarshipProgram.find(query)
      .populate('provider', 'organizationName type')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await ScholarshipProgram.countDocuments(query);
    res.json({ programs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const rankApplicants = async (req, res, next) => {
  try {
    const provider = await AidProvider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
    const program = await ScholarshipProgram.findOne({ _id: req.params.id, provider: provider._id });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const ranked = await rankApplicantsForProgram(program._id);
    res.json({ ranked });
  } catch (err) {
    next(err);
  }
};
