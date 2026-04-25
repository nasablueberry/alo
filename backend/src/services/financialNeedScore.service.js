import StudentProfile from '../models/StudentProfile.model.js';

/**
 * Scoring weights (must sum to 1.0)
 *
 * Component        Direction      Rationale
 * ─────────────────────────────────────────
 * income           lower = more need
 * family size      larger = more need
 * academic merit   higher CGPA/attendance = more deserving of aid
 * documents        more verified docs = more trust
 */
const INCOME_WEIGHT     = 0.40;
const FAMILY_WEIGHT     = 0.20;
const ACADEMIC_WEIGHT   = 0.30;
const DOCUMENT_WEIGHT   = 0.10;

const MAX_INCOME_REF    = 50000;  // BDT — families above this are considered financially stable
const MAX_FAMILY_SIZE   = 10;

/**
 * Calculate a 0–100 financial need + merit composite score.
 * Higher = more eligible (greater need AND/OR stronger academics).
 */
export function calculateFinancialNeedScore(student) {
  const income     = Number(student.householdIncome) || 0;
  const familySize = Number(student.familySize)      || 1;
  const cgpa       = Number(student.cgpa)            ?? 0;
  const attendance = Number(student.attendancePercentage) ?? 0;
  const docs       = student.documents || [];

  // Need components (higher income → lower need score)
  const incomeScore = Math.max(0, 1 - income / MAX_INCOME_REF);  // 0 at MAX_INCOME_REF+

  // Larger family → more need
  const familyScore = Math.min(1, (familySize - 1) / (MAX_FAMILY_SIZE - 1));

  // Academic merit — higher CGPA and attendance boost the score
  const academicScore = (cgpa / 4) * 0.55 + (attendance / 100) * 0.45;

  // Document completeness bonus (up to 1 for 4+ verified docs)
  const verifiedDocCount = docs.filter((d) => d.verified).length;
  const docScore = Math.min(1, verifiedDocCount / 4);

  const raw =
    incomeScore   * INCOME_WEIGHT  +
    familyScore   * FAMILY_WEIGHT  +
    academicScore * ACADEMIC_WEIGHT +
    docScore      * DOCUMENT_WEIGHT;

  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

/**
 * Recalculate, persist, and return the updated score for a student.
 * Returns the new score, or null if the student was not found.
 */
export async function updateStudentFinancialNeedScore(studentId) {
  const student = await StudentProfile.findById(studentId);
  if (!student) return null;

  const score = calculateFinancialNeedScore(student);
  await StudentProfile.findByIdAndUpdate(studentId, {
    financialNeedScore: score,
    lastNeedScoreUpdate: new Date(),
  });
  return score;
}

