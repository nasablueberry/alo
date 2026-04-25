import Application from '../models/Application.model.js';
import Disbursement from '../models/Disbursement.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';

export async function checkDuplicateAid(studentId, programId) {
  const activePrograms = await ScholarshipProgram.find({ status: 'active' }).select('_id');
  const programIds = activePrograms.map((p) => p._id.toString()).filter((id) => id !== programId);

  const approvedSameStudent = await Application.find({
    student: studentId,
    status: 'approved',
    program: { $in: programIds },
  })
    .populate('program')
    .lean();

  const recentDisbursements = await Disbursement.find({
    student: studentId,
    status: 'released',
    releaseDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  }).lean();

  const hasConflict = approvedSameStudent.length > 0 || recentDisbursements.length > 0;
  const details = [];
  if (approvedSameStudent.length) {
    details.push(`Student already has approved application(s) for: ${approvedSameStudent.map((a) => a.program?.title).join(', ')}`);
  }
  if (recentDisbursements.length) {
    details.push(`Student has ${recentDisbursements.length} disbursement(s) in the last 12 months.`);
  }

  return {
    hasConflict,
    message: hasConflict ? 'Duplicate aid conflict: student may already be receiving active scholarship(s).' : null,
    details,
  };
}
