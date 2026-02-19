import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/stores/applicationStore';
import { handoffStore } from '@/lib/stores/handoffStore';
import { maskSSN } from '@/lib/utils/piiUtils';

/**
 * Admin endpoint to view stored applications and handoff records.
 * SSN and DOB are encrypted at rest and decrypted for viewing.
 * SSN is masked in the response for additional security.
 */
export async function GET() {
    // Get decrypted applications (SSN/DOB decrypted automatically)
    const applications = applicationStore.getAll().map(app => ({
        ...app,
        ssn: maskSSN(app.ssn), // Mask SSN in admin view
    }));

    // Get raw encrypted data to show encryption is working
    const encryptedApplications = applicationStore.getAllEncrypted().map(app => ({
        applicationId: app.applicationId,
        ssnEncrypted: app.ssn,
        dobEncrypted: app.dateOfBirth,
    }));

    const handoffRecords = handoffStore.getAll();

    return NextResponse.json({
        message: 'Admin view - stored applications and handoff records',
        note: 'SSN and DOB are encrypted at rest using AES-256-GCM',
        counts: {
            applications: applications.length,
            handoffRecords: handoffRecords.length,
        },
        applications,
        encryptedFields: encryptedApplications,
        handoffRecords,
    });
}
