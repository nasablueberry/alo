import StudentProfile from '../models/StudentProfile.model.js';

const ATTENDANCE_THRESHOLD = 75;
const CGPA_THRESHOLD = 2.5;
const INCOME_AT_RISK = 20000;

export async function identifyAtRiskStudents() {
  const students = await StudentProfile.find({ verificationStatus: 'verified' }).lean();

  const atRisk = students.filter((s) => {
    const lowAttendance = (s.attendancePercentage ?? 100) < ATTENDANCE_THRESHOLD;
    const lowCgpa = (s.cgpa ?? 4) < CGPA_THRESHOLD;
    const lowIncome = (s.householdIncome ?? 0) < INCOME_AT_RISK;
    const reasons = [];
    if (lowAttendance) reasons.push('low attendance');
    if (lowCgpa) reasons.push('low CGPA');
    if (lowIncome) reasons.push('low household income');
    return reasons.length >= 1;
  });

  for (const s of atRisk) {
    const reasons = [];
    if ((s.attendancePercentage ?? 100) < ATTENDANCE_THRESHOLD) reasons.push('Attendance below 75%');
    if ((s.cgpa ?? 4) < CGPA_THRESHOLD) reasons.push('CGPA below 2.5');
    if ((s.householdIncome ?? 0) < INCOME_AT_RISK) reasons.push('Household income below BDT 20,000');
    await StudentProfile.findByIdAndUpdate(s._id, {
      isAtRisk: true,
      atRiskReason: reasons.join('; '),
    });
  }

  const notAtRiskIds = students.filter((s) => !atRisk.find((a) => a._id.equals(s._id))).map((s) => s._id);
  if (notAtRiskIds.length) {
    await StudentProfile.updateMany(
      { _id: { $in: notAtRiskIds } },
      { isAtRisk: false, atRiskReason: null }
    );
  }

  return atRisk.length;
}
