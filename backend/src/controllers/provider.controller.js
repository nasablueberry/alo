import AidProvider from '../models/AidProvider.model.js';
import { createAuditLog } from '../utils/auditLog.js';

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await AidProvider.findOne({ user: req.user._id }).populate('user', 'email');
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await AidProvider.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });

    const allowed = ['organizationName', 'type', 'registrationNumber', 'contactPerson', 'phone', 'address', 'district', 'website', 'description'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) profile[key] = req.body[key];
    });
    await profile.save();
    await createAuditLog({ userId: req.user._id, action: 'update', resource: 'AidProvider', resourceId: profile._id, req });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};
