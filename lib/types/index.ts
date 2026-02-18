export interface ApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  programName: string;
  amountRequested: number;
  agreementAccepted: boolean;
}

export interface Application extends ApplicationInput {
  applicationId: string;
  submittedAt: Date;
}

export interface TriageResult {
  reviewTier: "standard" | "manual_review";
  riskFlags: string[];
}

export interface HandoffRecord {
  applicationId: string;
  applicantName: string;
  email: string;
  programName: string;
  amountRequested: number;
  reviewTier: "standard" | "manual_review";
  riskFlags: string[];
  submittedAt: Date;
}

export interface ApplicationResponse {
  applicationId: string;
  reviewTier: "standard" | "manual_review";
  riskFlags: string[];
  message: string;
}

export interface SSNValidationResult {
  isValid: boolean;
  flags: string[];
}
