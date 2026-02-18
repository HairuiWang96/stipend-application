import { SSNValidationResult } from "../types";

/**
 * Validates SSN format and checks for known invalid patterns.
 * Returns validation result with flags for any issues found.
 */
export function validateSSN(ssn: string): SSNValidationResult {
  const flags: string[] = [];

  // Normalize SSN - remove dashes
  const normalizedSSN = ssn.replace(/-/g, "");

  // Check format (should be 9 digits after normalization)
  if (!/^\d{9}$/.test(normalizedSSN)) {
    flags.push("Invalid SSN format");
    return { isValid: false, flags };
  }

  const areaNumber = normalizedSSN.substring(0, 3);
  const groupNumber = normalizedSSN.substring(3, 5);
  const serialNumber = normalizedSSN.substring(5, 9);

  // Check for all same digits (e.g., 111-11-1111)
  if (/^(\d)\1{8}$/.test(normalizedSSN)) {
    flags.push("SSN contains all identical digits");
  }

  // Check for sequential digits (123-45-6789)
  if (normalizedSSN === "123456789") {
    flags.push("SSN is a sequential pattern");
  }

  // Check for reverse sequential (987-65-4321)
  if (normalizedSSN === "987654321") {
    flags.push("SSN is a reverse sequential pattern");
  }

  // Area number cannot be 000
  if (areaNumber === "000") {
    flags.push("SSN area number (first 3 digits) cannot be 000");
  }

  // Area number 666 was never issued
  if (areaNumber === "666") {
    flags.push("SSN area number 666 was never issued");
  }

  // Area numbers 900-999 are reserved for ITINs (not valid SSNs)
  if (parseInt(areaNumber, 10) >= 900) {
    flags.push("SSN area number 900-999 is reserved for ITIN");
  }

  // Group number cannot be 00
  if (groupNumber === "00") {
    flags.push("SSN group number (middle 2 digits) cannot be 00");
  }

  // Serial number cannot be 0000
  if (serialNumber === "0000") {
    flags.push("SSN serial number (last 4 digits) cannot be 0000");
  }

  return {
    isValid: flags.length === 0,
    flags,
  };
}
