import Disbursement from '../models/Disbursement.model.js';
import Application from '../models/Application.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import StudentProfile from '../models/StudentProfile.model.js';

export const regionalImpact = async (req, res, next) => {
  try {
    const disbursements = await Disbursement.find({ status: 'released' })
      .populate('student', 'district upazila')
      .lean();
    const byDistrict = {};
    const byUpazila = {};
    disbursements.forEach((d) => {
      const dist = d.student?.district || 'Unknown';
      const up = d.student?.upazila || 'Unknown';
      const key = `${dist}|${up}`;
      byDistrict[dist] = (byDistrict[dist] || { students: new Set(), amount: 0 });
      byDistrict[dist].students.add(d.student?._id);
      byDistrict[dist].amount += d.amount;
      byUpazila[key] = (byUpazila[key] || { district: dist, upazila: up, students: new Set(), amount: 0 });
      byUpazila[key].students.add(d.student?._id);
      byUpazila[key].amount += d.amount;
    });
    const districtSummary = Object.entries(byDistrict).map(([name, v]) => ({
      district: name,
      studentCount: v.students.size,
      totalAmount: v.amount,
    }));
    const upazilaSummary = Object.values(byUpazila).map((v) => ({
      ...v,
      studentCount: v.students.size,
    }));
    res.json({ byDistrict: districtSummary, byUpazila: upazilaSummary });
  } catch (err) {
    next(err);
  }
};

export const aggregation = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.releaseDate = {};
      if (from) match.releaseDate.$gte = new Date(from);
      if (to) match.releaseDate.$lte = new Date(to);
    }
    const appMatch = (from || to) ? { createdAt: {} } : {};
    if (from) appMatch.createdAt.$gte = new Date(from);
    if (to) appMatch.createdAt.$lte = new Date(to);

    const [disbursementStats, applicationStats, programStats] = await Promise.all([
      Disbursement.aggregate([
        { $match: { status: 'released', ...match } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).then((r) => r[0] || { totalAmount: 0, count: 0 }),
      Application.aggregate([
        { $match: Object.keys(appMatch).length ? appMatch : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).then((r) => Object.fromEntries(r.map((x) => [x._id, x.count]))),
      ScholarshipProgram.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalFund: { $sum: '$totalFund' }, remainingFund: { $sum: '$remainingFund' } } },
      ]),
    ]);
    res.json({ disbursementStats, applicationStats, programStats });
  } catch (err) {
    next(err);
  }
};
