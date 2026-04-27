import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AidProvider from '../models/AidProvider.model.js';
import { createAuditLog } from '../utils/auditLog.js';
import { sendEmail, templates } from '../utils/email.js';
import { updateStudentFinancialNeedScore } from '../services/financialNeedScore.service.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' }); 

export const registerStudent = async (req, res, next) => {
  try {
    const { email, password, birthCertificateId, fullName, phone, dateOfBirth, gender, district, upazila, institutionName, institutionType, householdIncome, familySize, attendancePercentage, cgpa } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const existingBirth = await StudentProfile.findOne({ birthCertificateId });
    if (existingBirth) return res.status(400).json({ message: 'Birth Certificate ID already registered' });

    const user = await User.create({ email, password, role: 'student' });
    const studentProfile = await StudentProfile.create({
      user: user._id,
      birthCertificateId,
      fullName,
      phone,
      dateOfBirth,
      gender,
      district,
      upazila,
      institutionName,
      institutionType,
      householdIncome: Number(householdIncome),
      familySize: Number(familySize) || 1,
      attendancePercentage: Number(attendancePercentage) || 0,
      cgpa: Number(cgpa) || 0,
    });

    // Calculate and persist the initial eligibility score right away
    await updateStudentFinancialNeedScore(studentProfile._id);

    const token = generateToken(user._id);
    await createAuditLog({ userId: user._id, action: 'register', resource: 'user', resourceId: user._id, details: { role: 'student' }, req });
    const t = templates().registration(fullName);
    await sendEmail({ to: email, ...t });
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

export const registerProvider = async (req, res, next) => {
  try {
    const { email, password, organizationName, type, registrationNumber, contactPerson, phone, address, district, website, description } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ email, password, role: 'provider' });
    await AidProvider.create({
      user: user._id,
      organizationName,
      type,
      registrationNumber,
      contactPerson,
      phone,
      address,
      district,
      website,
      description,
    });

    const token = generateToken(user._id);
    await createAuditLog({ userId: user._id, action: 'register', resource: 'user', resourceId: user._id, details: { role: 'provider' }, req });
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const token = generateToken(user._id);
    await createAuditLog({ userId: user._id, action: 'login', resource: 'user', resourceId: user._id, req });
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    let profile = null;
    if (req.user.role === 'student') {
      profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'email');
    } else if (req.user.role === 'provider') {
      profile = await AidProvider.findOne({ user: req.user._id }).populate('user', 'email');
    }
    res.json({ user: req.user, profile });
  } catch (err) {
    next(err);
  }
};
