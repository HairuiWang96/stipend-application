# Stipend Application Submission

A Next.js application for submitting and processing stipend (grant) applications with secure PII handling and automated triage.

## Features

- **Application Form**: Collect applicant and program information via a user-friendly form
- **Secure API**: RESTful endpoint with API key authentication and rate limiting
- **PII Protection**: AES-256-GCM encryption for sensitive data (SSN, DOB)
- **Automated Triage**: Business rules to determine review tier and flag applications
- **Downstream Handoff**: Minimal data handoff records for downstream processing

---

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

Copy the example environment file and update with your own values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable         | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `API_KEY`        | Secret key for authenticating API requests                               |
| `ENCRYPTION_KEY` | Key for encrypting PII (SSN, DOB) - generate with `openssl rand -hex 32` |

For local development, default values are provided in `.env.example`.

---

## Project Structure

```
/app
  /apply
    page.tsx              # Application form page
  /api
    /applications
      route.ts            # POST /api/applications endpoint
    /admin
      /applications
        route.ts          # GET /api/admin/applications (view stored data)
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
    encryption.ts         # AES-256-GCM encryption for PII
/components
  ApplicationForm.tsx     # React Hook Form component
/__tests__
  triageService.test.ts   # Business rules tests (15 tests)
```

---

## API Endpoints

### POST /api/applications

Submit a new stipend application.

**Headers:**
- `X-API-Key`: Required API key for authentication

**Response:**
```json
{
  "applicationId": "uuid",
  "reviewTier": "standard" | "manual_review",
  "riskFlags": ["string"]
}
```

### GET /api/admin/applications

View stored application data (admin endpoint).

---

## PII Handling

### What data is considered sensitive

| Field         | Sensitivity Level | Reasoning                                  |
| ------------- | ----------------- | ------------------------------------------ |
| SSN           | **Critical**      | Direct identifier, enables identity theft  |
| Date of Birth | **High**          | Combined with name = identity verification |
| Full Address  | **Medium-High**   | Physical location, privacy concern         |
| Phone         | **Medium**        | Personal contact information               |
| Email         | **Medium**        | Personal contact, often semi-public        |
| Name          | **Low-Medium**    | Common, but needed for processing          |

### How sensitive data is protected

1. **API Response**: The API never returns SSN, DOB, or address. Only the `applicationId`, `reviewTier`, and `riskFlags` are returned.

2. **Handoff Record**: The downstream handoff record excludes:
    - SSN (critical - never passed downstream)
    - Date of Birth (only age is used for triage, then discarded)
    - Full Address (not needed for downstream processing)
    - Phone number (only email retained for contact)

3. **UI Input**: SSN field defaults to masked with a show/hide toggle icon (open eye to reveal, closed eye to hide), and uses `autoComplete="off"` to prevent browser caching.

4. **Error Logging**: The API catches errors without logging request bodies that might contain PII. Only error messages are logged.

5. **In-Memory Storage**: Full application data (including PII) is stored only in the application store. The separate handoff store contains the minimal record needed for downstream systems.

6. **Encryption at Rest**: SSN and Date of Birth are encrypted using AES-256-GCM before being stored in memory. This protects against memory dumps and unauthorized access to the application store.

---

## Business Rules and Triage

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
    applicationId: string; // Reference to full application
    applicantName: string; // First + Last name
    email: string; // Contact for follow-up
    programName: string; // Program applied for
    amountRequested: number; // Funding amount
    reviewTier: string; // Processing tier
    riskFlags: string[]; // Reasons for manual review
    submittedAt: Date; // Submission timestamp
}
```

**Rationale**: Downstream systems can request full application details via `applicationId` if needed, following the principle of data minimization.

---

## Rate Limiting

The API implements in-memory rate limiting to prevent abuse:

- **Limit**: 10 requests per minute per IP address
- **Algorithm**: Sliding window with automatic cleanup of expired entries

### Rate Limit Headers

All responses include rate limit headers:

| Header                  | Description                            |
| ----------------------- | -------------------------------------- |
| `X-RateLimit-Limit`     | Maximum requests allowed (10)          |
| `X-RateLimit-Remaining` | Requests remaining in current window   |
| `X-RateLimit-Reset`     | Unix timestamp when the window resets  |
| `Retry-After`           | Seconds to wait (only on 429 responses)|

### Rate Limit Response

When the limit is exceeded, the API returns:

```json
{
  "error": "Too many requests. Please try again later."
}
```

With HTTP status `429 Too Many Requests`.

---

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes 15 tests covering:
- Business rule evaluation
- SSN validation patterns
- Age verification logic
- Triage tier assignment

---

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Validation**: Zod schemas
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Testing**: Jest
- **Encryption**: AES-256-GCM (Node.js crypto)
