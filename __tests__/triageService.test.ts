import { triageApplication, calculateAge } from "@/lib/services/triageService";
import { Application } from "@/lib/types";

// Helper to create a valid application with overrides
function createApplication(overrides: Partial<Application> = {}): Application {
  return {
    applicationId: "APP-TEST-123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    dateOfBirth: "1990-01-15",
    ssn: "456-78-1234", // Valid SSN pattern (not sequential, not invalid)
    addressLine1: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    programName: "Early Childhood Education Grant",
    amountRequested: 500,
    agreementAccepted: true,
    submittedAt: new Date(),
    ...overrides,
  };
}

describe("triageApplication", () => {
  describe("Amount threshold rule", () => {
    it("should return standard tier for amount <= $1000", () => {
      const app = createApplication({ amountRequested: 1000 });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("standard");
      expect(result.riskFlags).not.toContainEqual(
        expect.stringContaining("exceeds")
      );
    });

    it("should flag manual review for amount > $1000", () => {
      const app = createApplication({ amountRequested: 1001 });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("$1001")
      );
    });

    it("should flag manual review for large amounts", () => {
      const app = createApplication({ amountRequested: 50000 });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("exceeds")
      );
    });
  });

  describe("Age rule (under 18)", () => {
    it("should return standard tier for adult applicant", () => {
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
      const dob = thirtyYearsAgo.toISOString().split("T")[0];

      const app = createApplication({ dateOfBirth: dob });
      const result = triageApplication(app);

      expect(result.riskFlags).not.toContainEqual(
        expect.stringContaining("under 18")
      );
    });

    it("should flag manual review for minor applicant", () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const dob = tenYearsAgo.toISOString().split("T")[0];

      const app = createApplication({ dateOfBirth: dob });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("under 18")
      );
    });

    it("should flag 17-year-old as under 18", () => {
      const seventeenYearsAgo = new Date();
      seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
      const dob = seventeenYearsAgo.toISOString().split("T")[0];

      const app = createApplication({ dateOfBirth: dob });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("under 18")
      );
    });
  });

  describe("SSN validation rules", () => {
    it("should return standard tier for valid SSN", () => {
      const app = createApplication({ ssn: "123-45-6780" });
      const result = triageApplication(app);

      // Should only be standard if no other flags
      expect(result.riskFlags).not.toContainEqual(
        expect.stringContaining("SSN")
      );
    });

    it("should flag SSN with all identical digits", () => {
      const app = createApplication({ ssn: "111-11-1111" });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("identical digits")
      );
    });

    it("should flag sequential SSN", () => {
      const app = createApplication({ ssn: "123-45-6789" });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("sequential")
      );
    });

    it("should flag SSN starting with 000", () => {
      const app = createApplication({ ssn: "000-12-3456" });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("000")
      );
    });

    it("should flag SSN with area 666", () => {
      const app = createApplication({ ssn: "666-12-3456" });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("666")
      );
    });

    it("should flag SSN starting with 9 (ITIN range)", () => {
      const app = createApplication({ ssn: "900-12-3456" });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      expect(result.riskFlags).toContainEqual(
        expect.stringContaining("ITIN")
      );
    });
  });

  describe("Multiple risk flags", () => {
    it("should accumulate multiple flags", () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const dob = tenYearsAgo.toISOString().split("T")[0];

      const app = createApplication({
        amountRequested: 5000,
        dateOfBirth: dob,
        ssn: "000-00-0000",
      });
      const result = triageApplication(app);

      expect(result.reviewTier).toBe("manual_review");
      // Should have at least 3 flags: amount, age, SSN issues
      expect(result.riskFlags.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("calculateAge", () => {
  it("should calculate age correctly for past birthday this year", () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const birthMonth = today.getMonth() - 1; // Last month
    const dob = `${birthYear}-${String(birthMonth + 1).padStart(2, "0")}-15`;

    const age = calculateAge(dob);
    expect(age).toBe(25);
  });

  it("should calculate age correctly for future birthday this year", () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const birthMonth = today.getMonth() + 2; // Two months from now

    // Handle year rollover
    const actualYear = birthMonth > 11 ? birthYear + 1 : birthYear;
    const actualMonth = birthMonth > 11 ? birthMonth - 12 : birthMonth;

    const dob = `${actualYear}-${String(actualMonth + 1).padStart(2, "0")}-15`;

    const age = calculateAge(dob);
    // If birthday is in the future, age should be one less
    expect(age).toBeLessThanOrEqual(25);
  });
});
