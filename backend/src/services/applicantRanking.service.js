import Application from '../models/Application.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import { buildSubmittedToProviderFilter } from '../constants/applicationFilters.js';

export async function rankApplicantsForProgram(programId) {
  const applications = await Application.find({
    program: programId,
    eligibilityPassed: true,
    status: 'pending',
    ...buildSubmittedToProviderFilter(),
  })
    .populate('student')
    .lean();

  const students = await StudentProfile.find({
    _id: { $in: applications.map((a) => a.student._id) },
  }).lean();

  const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

  const scored = applications.map((app) => {
    const student = studentMap[app.student._id.toString()] || app.student;
    const cgpaNorm = (student.cgpa ?? 0) / 4;
    const attendanceNorm = (student.attendancePercentage ?? 0) / 100;
    const needNorm = (student.financialNeedScore ?? 0) / 100;
    const rankScore = cgpaNorm * 0.4 + attendanceNorm * 0.3 + needNorm * 0.3;
    return { applicationId: app._id, rankScore };
  });

  scored.sort((a, b) => b.rankScore - a.rankScore);

  for (let i = 0; i < scored.length; i++) {
    await Application.findByIdAndUpdate(scored[i].applicationId, { rankScore: scored[i].rankScore });
  }

  return scored;
}
