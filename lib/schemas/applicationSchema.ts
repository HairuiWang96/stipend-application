import { z } from "zod";

export const applicationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^[\d\s\-()]+$/,
      "Phone number can only contain digits, spaces, dashes, and parentheses"
    )
    .min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  ssn: z
    .string()
    .min(1, "Social Security Number is required")
    .regex(
      /^(\d{3}-\d{2}-\d{4}|\d{9})$/,
      "SSN must be in format XXX-XX-XXXX or XXXXXXXXX"
    ),
  addressLine1: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must be 100 characters or less"),
  addressLine2: z
    .string()
    .max(100, "Address line 2 must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(1, "City is required")
    .max(50, "City must be 50 characters or less"),
  state: z
    .string()
    .min(1, "State is required")
    .length(2, "State must be a 2-letter code")
    .regex(/^[A-Z]{2}$/, "State must be uppercase 2-letter code"),
  zipCode: z
    .string()
    .min(1, "ZIP code is required")
    .regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  programName: z
    .string()
    .min(1, "Program name is required")
    .max(100, "Program name must be 100 characters or less"),
  amountRequested: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(100000, "Amount cannot exceed $100,000"),
  agreementAccepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the agreement"),
});

export type ApplicationSchemaType = z.infer<typeof applicationSchema>;
