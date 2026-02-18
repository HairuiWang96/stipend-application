import { Application, HandoffRecord, TriageResult } from "../types";

/**
 * Mask SSN to show only last 4 digits.
 * Input: "123-45-6789" or "123456789"
 * Output: "***-**-6789"
 */
export function maskSSN(ssn: string): string {
  // Normalize - remove dashes
  const normalized = ssn.replace(/-/g, "");

  if (normalized.length !== 9) {
    return "***-**-****";
  }

  const lastFour = normalized.slice(-4);
  return `***-**-${lastFour}`;
}

/**
 * Generate a unique application ID.
 * Format: APP-TIMESTAMP-RANDOM
 */
export function generateApplicationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

/**
 * Create a handoff record with minimal PII for downstream processing.
 * Excludes: SSN, DOB, full address, phone
 * Includes: Name, email, program info, triage results
 */
export function createHandoffRecord(
  application: Application,
  triage: TriageResult
): HandoffRecord {
  return {
    applicationId: application.applicationId,
    applicantName: `${application.firstName} ${application.lastName}`,
    email: application.email,
    programName: application.programName,
    amountRequested: application.amountRequested,
    reviewTier: triage.reviewTier,
    riskFlags: triage.riskFlags,
    submittedAt: application.submittedAt,
  };
}
