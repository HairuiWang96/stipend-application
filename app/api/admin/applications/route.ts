import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/stores/applicationStore';
import { handoffStore } from '@/lib/stores/handoffStore';
import { maskSSN } from '@/lib/utils/piiUtils';

/**
 * Admin endpoint to view stored applications and handoff records.
 * SSN is masked in the response for security.
 */
export async function GET() {
    const applications = applicationStore.getAll().map(app => ({
        ...app,
        ssn: maskSSN(app.ssn), // Mask SSN in admin view
    }));

    const handoffRecords = handoffStore.getAll();

    return NextResponse.json({
        message: 'Admin view - stored applications and handoff records',
        counts: {
            applications: applications.length,
            handoffRecords: handoffRecords.length,
        },
        applications,
        handoffRecords,
    });
}
