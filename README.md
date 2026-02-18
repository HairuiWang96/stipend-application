# ECE-Take-Home Exercise: Stipend Application Submission

Thank you for taking the time to complete this exercise.

This assignment is designed to mirror the type of work you would do on our Early Childhood Education platforms. We are not looking for a perfect or production-ready solution. We are interested in how you think, how you structure code, and how you make tradeoffs.

Please keep the scope intentionally small and do not over-engineer.

---

## Time Expectation

Please do not spend more than four hours. If you run out of time, document what you would do next.

---

## Goal

Build a small stipend (or grant) application flow that:

- Collects applicant information via a Next.js UI
- Submits the data to a backend API
- Persists the submission in memory
- Performs basic business rules or triage
- Creates a decoupled handoff record for downstream processing
- Demonstrates care in handling sensitive personal data

---

## Technical Constraints

- Next.js with TypeScript is required
- UI may be minimal, no styling or design polish required
- Persistence must be in memory
- No databases, Docker, AWS accounts, or external services
- The project should run locally using:
  - `npm install`
  - `npm run dev`

---

## What to Build

### 1. User Interface

Create a page at `/apply` with a form that collects the following information.

#### Applicant Information
- First name
- Last name
- Email
- Phone number
- Date of birth
- Social Security Number (full SSN, allow dashes)
- Address line 1
- Address line 2 (optional)
- City
- State (2-letter code)
- ZIP code

#### Program Information
- Program name
- Amount requested
- Agreement checkbox (boolean)

---

### 2. API Endpoint

Create a backend endpoint at:

`POST /api/applications`

The API should:
- Persist the full application in an in-memory store
- Generate and return an `applicationId`

#### Authentication
Require an API key via request header:

`X-API-Key`

- Return `401` if the header is missing or invalid

---

### 3. Basic Business Rules (Triage)

After validation and persistence, apply a small set of business rules to determine how the application should be processed.

Assign:
- `reviewTier`: `standard` or `manual_review`
- `riskFlags`: an array of strings explaining why manual review is required

Manual Review Rules:
- Amount requested above a threshold $1000
- Applicant under 18 based on date of birth
- Invalid or unusual SSN patterns
- Other simple, deterministic checks

---

### 4. Downstream Handoff

After submission and triage, create a separate in-memory record that represents what another internal system would need to continue processing the application.

This record should:
- Be stored separately from the full application
- Include only what is necessary to continue processing

---

### 5. Minimal Testing

Add at least one meaningful test. For example:
- API authentication or validation
- Business rule evaluation
- Input validation logic

Keep this light. We are not evaluating test coverage.

---

## README (This File)

In addition to implementing the exercise, please include a short explanation covering the following topics.

### PII Handling
- What data you considered sensitive
- How you avoided exposing sensitive data in logs, responses, and UI

### Business Rules and Handoff
- How your triage logic works

### AI Tool Usage
- If you used AI tools, describe:
  - What you used them for
  - How you validated the output

---

## Submission

Please provide:
- A GitHub repository link (public repo or grant us access to private repo)
- This README with your implementation notes
- Any setup notes needed to run the project

If you ran out of time, include a brief "Next Steps" section describing what you would improve first.

---

## What We Are Evaluating

We are not grading UI design or completeness.

We are evaluating:
- Code clarity and structure
- Thoughtful API and data design
- Responsible handling of sensitive data
- Ability to apply simple business logic cleanly
- Separation of concerns
- Clear communication of tradeoffs

Thank you for your time. We look forward to reviewing your work.

---
---

# Implementation Notes

## Setup & Running the Project

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000/apply](http://localhost:3000/apply) to access the application form.

### Environment Variables

The project includes a `.env.local` file with the API key. For local development, the default key is `stipend-api-key-2024`.

---

## Project Structure

```
/app
  /apply
    page.tsx              # Application form page
  /api
    /applications
      route.ts            # POST /api/applications endpoint
/lib
  /stores
    applicationStore.ts   # In-memory full application storage
    handoffStore.ts       # In-memory handoff record storage
  /services
    triageService.ts      # Business rules / triage logic
    ssnValidator.ts       # SSN pattern validation
  /schemas
    applicationSchema.ts  # Zod validation schemas
  /types
    index.ts              # TypeScript interfaces
  /utils
    piiUtils.ts           # SSN masking, handoff record creation
/components
  ApplicationForm.tsx     # React Hook Form component
/__tests__
  triageService.test.ts   # Business rules tests (15 tests)
```

---

## PII Handling

### What data is considered sensitive

| Field | Sensitivity Level | Reasoning |
|-------|-------------------|-----------|
| SSN | **Critical** | Direct identifier, enables identity theft |
| Date of Birth | **High** | Combined with name = identity verification |
| Full Address | **Medium-High** | Physical location, privacy concern |
| Phone | **Medium** | Personal contact information |
| Email | **Medium** | Personal contact, often semi-public |
| Name | **Low-Medium** | Common, but needed for processing |

### How sensitive data is protected

1. **API Response**: The API never returns SSN, DOB, or address. Only the `applicationId`, `reviewTier`, and `riskFlags` are returned.

2. **Handoff Record**: The downstream handoff record excludes:
   - SSN (critical - never passed downstream)
   - Date of Birth (only age is used for triage, then discarded)
   - Full Address (not needed for downstream processing)
   - Phone number (only email retained for contact)

3. **UI Input**: SSN field uses `type="password"` and `autoComplete="off"` to prevent visual exposure and browser caching.

4. **Error Logging**: The API catches errors without logging request bodies that might contain PII. Only error messages are logged.

5. **In-Memory Storage**: Full application data (including PII) is stored only in the application store. The separate handoff store contains the minimal record needed for downstream systems.

---

## Business Rules and Handoff

### Triage Logic

The `triageService.ts` evaluates each application and assigns:

- `reviewTier`: `"standard"` or `"manual_review"`
- `riskFlags`: Array of strings explaining why manual review is required

**Rules that trigger manual review:**

1. **Amount Threshold**: Amount requested > $1,000
2. **Age Verification**: Applicant under 18 years old (calculated from DOB)
3. **SSN Validation**: Invalid or suspicious SSN patterns:
   - All identical digits (e.g., 111-11-1111)
   - Sequential patterns (123-45-6789, 987-65-4321)
   - Area number 000 (invalid)
   - Area number 666 (never issued)
   - Area numbers 900-999 (reserved for ITIN)
   - Group number 00 (invalid)
   - Serial number 0000 (invalid)

### Handoff Record Design

The handoff record is intentionally minimal, containing only what downstream systems need:

```typescript
interface HandoffRecord {
  applicationId: string;      // Reference to full application
  applicantName: string;      // First + Last name
  email: string;              // Contact for follow-up
  programName: string;        // Program applied for
  amountRequested: number;    // Funding amount
  reviewTier: string;         // Processing tier
  riskFlags: string[];        // Reasons for manual review
  submittedAt: Date;          // Submission timestamp
}
```

**Rationale**: Downstream systems can request full application details via `applicationId` if needed, following the principle of data minimization.

---

## AI Tool Usage

**Tools Used**: Claude Code (Anthropic's CLI tool)

**What it was used for**:

- Project scaffolding and file structure planning
- Generating TypeScript interfaces and Zod schemas
- Implementing SSN validation patterns (researched valid SSN rules)
- Writing Jest test cases for business rules
- README documentation

**How output was validated**:

1. **Manual Code Review**: All generated code was reviewed for correctness and security
2. **Test Execution**: Ran `npm test` to verify all 15 tests pass
3. **Local Testing**: Manually tested the form submission flow in browser
4. **TypeScript Compilation**: Ensured `npm run build` completes without errors
5. **SSN Rules Verification**: Cross-referenced SSN validation rules with SSA documentation

---

## Next Steps (If More Time)

If I had additional time, I would:

1. **Add API Integration Tests**: Test the full `/api/applications` endpoint with supertest
2. **Add Rate Limiting**: Prevent abuse of the application endpoint
3. **Encrypt PII at Rest**: Even for in-memory storage, encrypt SSN before storing
4. **Add Input Sanitization**: Additional XSS prevention for text fields
5. **Add Audit Logging**: Track application submissions (without logging PII)
6. **Add CSRF Protection**: For the form submission
7. **Improve Error Messages**: More user-friendly validation feedback
