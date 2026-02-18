import { Application, TriageResult } from "../types";
import { validateSSN } from "./ssnValidator";

const AMOUNT_THRESHOLD = 1000;
const MINIMUM_AGE = 18;

/**
 * Calculate age from date of birth string (YYYY-MM-DD format)
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Apply business rules to determine review tier and risk flags.
 *
 * Rules for manual review:
 * 1. Amount requested exceeds $1000
 * 2. Applicant is under 18 years old
 * 3. SSN has invalid or suspicious patterns
 */
export function triageApplication(application: Application): TriageResult {
  const riskFlags: string[] = [];

  // Rule 1: Amount exceeds threshold
  if (application.amountRequested > AMOUNT_THRESHOLD) {
    riskFlags.push(
      `Amount requested ($${application.amountRequested}) exceeds $${AMOUNT_THRESHOLD} threshold`
    );
  }

  // Rule 2: Applicant is under 18
  const age = calculateAge(application.dateOfBirth);
  if (age < MINIMUM_AGE) {
    riskFlags.push(`Applicant is under ${MINIMUM_AGE} years old (age: ${age})`);
  }

  // Rule 3: Invalid or suspicious SSN patterns
  const ssnValidation = validateSSN(application.ssn);
  if (!ssnValidation.isValid) {
    riskFlags.push(...ssnValidation.flags);
  }

  return {
    reviewTier: riskFlags.length > 0 ? "manual_review" : "standard",
    riskFlags,
  };
}

// Export for testing
export { calculateAge };
