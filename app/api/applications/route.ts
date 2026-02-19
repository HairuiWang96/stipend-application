import { NextRequest, NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/schemas/applicationSchema';
import { applicationStore } from '@/lib/stores/applicationStore';
import { handoffStore } from '@/lib/stores/handoffStore';
import { triageApplication } from '@/lib/services/triageService';
import { generateApplicationId, createHandoffRecord } from '@/lib/utils/piiUtils';
import { Application, ApplicationResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
    // 1. Validate API key
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Parse request body
        const body = await request.json();

        // 3. Validate with Zod schema
        const parsed = applicationSchema.safeParse(body);
        if (!parsed.success) {
            const issues = parsed.error.issues || [];
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 },
            );
        }

        // 4. Create application with ID and timestamp
        const applicationId = generateApplicationId();
        const application: Application = {
            ...parsed.data,
            applicationId,
            submittedAt: new Date(),
        };

        // 5. Save full application (with all PII) to store
        applicationStore.save(application);

        // 6. Run triage to determine review tier
        const triage = triageApplication(application);

        // 7. Create and save handoff record (minimal PII)
        const handoff = createHandoffRecord(application, triage);
        handoffStore.save(handoff);

        // 8. Return safe response (no sensitive PII)
        const response: ApplicationResponse = {
            applicationId,
            reviewTier: triage.reviewTier,
            riskFlags: triage.riskFlags,
            message: 'Application submitted successfully',
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        // Avoid logging any request body that might contain PII
        console.error('Application submission error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
