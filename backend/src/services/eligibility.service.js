import StudentProfile from '../models/StudentProfile.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';

export async function checkEligibility(studentId, programId) {
  const [student, program] = await Promise.all([
    StudentProfile.findById(studentId),
    ScholarshipProgram.findById(programId),
  ]);
  if (!student || !program) return { eligible: false, notes: 'Student or program not found' };
  if (program.status !== 'active') return { eligible: false, notes: 'Program is not active' };
  if (new Date() > program.applicationDeadline) return { eligible: false, notes: 'Application deadline passed' };

  const criteria = program.eligibilityCriteria || {};
  const notes = [];

  if (criteria.minCgpa != null && student.cgpa < criteria.minCgpa) {
    notes.push(`CGPA ${student.cgpa} is below minimum ${criteria.minCgpa}`);
  }
  if (criteria.maxIncome != null && student.householdIncome > criteria.maxIncome) {
    notes.push(`Household income exceeds maximum allowed`);
  }
  if (criteria.minAttendance != null && student.attendancePercentage < criteria.minAttendance) {
    notes.push(`Attendance ${student.attendancePercentage}% is below minimum ${criteria.minAttendance}%`);
  }
  if (criteria.allowedDistricts?.length && !criteria.allowedDistricts.includes(student.district)) {
    notes.push('Your district is not in the allowed list');
  }
  if (criteria.allowedInstitutionTypes?.length && !criteria.allowedInstitutionTypes.includes(student.institutionType)) {
    notes.push('Your institution type is not eligible');
  }
  if (student.verificationStatus !== 'verified') {
    notes.push('Student profile/document verification is pending');
  }

  const eligible = notes.length === 0;
  return { eligible, notes: notes.join('; ') || 'Eligibility passed.' };
}
