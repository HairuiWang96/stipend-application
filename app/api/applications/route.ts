import { NextRequest, NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/schemas/applicationSchema';
import { applicationStore } from '@/lib/stores/applicationStore';
import { handoffStore } from '@/lib/stores/handoffStore';
import { triageApplication } from '@/lib/services/triageService';
import { generateApplicationId, createHandoffRecord } from '@/lib/utils/piiUtils';
import { applicationRateLimiter } from '@/lib/utils/rateLimiter';
import { Application, ApplicationResponse } from '@/lib/types';

/**
 * Get client IP address from request headers.
 */
function getClientIP(request: NextRequest): string {
    // Check common headers for proxied requests
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to a default identifier
    return 'unknown';
}

export async function POST(request: NextRequest) {
    // 1. Check rate limit (before any processing)
    const clientIP = getClientIP(request);
    const rateLimitResult = applicationRateLimiter.check(clientIP);

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
                    'X-RateLimit-Limit': '10',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                },
            },
        );
    }

    // 2. Validate API key
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

        return NextResponse.json(response, {
            status: 201,
            headers: {
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            },
        });
    } catch (error) {
        // Avoid logging any request body that might contain PII
        console.error('Application submission error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
