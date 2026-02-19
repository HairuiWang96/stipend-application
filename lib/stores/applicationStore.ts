import { Application } from '../types';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

/**
 * In-memory store for applications.
 * SSN and DOB are encrypted at rest for security.
 */
class ApplicationStore {
    private applications = new Map<string, Application>();

    /**
     * Save application with encrypted PII fields (SSN, DOB).
     */
    save(application: Application): void {
        const encryptedApplication: Application = {
            ...application,
            ssn: encrypt(application.ssn),
            dateOfBirth: encrypt(application.dateOfBirth),
        };
        this.applications.set(application.applicationId, encryptedApplication);
    }

    /**
     * Get application by ID with decrypted PII fields.
     */
    getById(id: string): Application | undefined {
        const app = this.applications.get(id);
        if (!app) return undefined;

        return this.decryptApplication(app);
    }

    /**
     * Get all applications with decrypted PII fields.
     */
    getAll(): Application[] {
        return Array.from(this.applications.values()).map(app => this.decryptApplication(app));
    }

    /**
     * Get all applications with PII still encrypted (for debugging/admin view).
     */
    getAllEncrypted(): Application[] {
        return Array.from(this.applications.values());
    }

    clear(): void {
        this.applications.clear();
    }

    /**
     * Decrypt PII fields in an application.
     */
    private decryptApplication(app: Application): Application {
        return {
            ...app,
            ssn: isEncrypted(app.ssn) ? decrypt(app.ssn) : app.ssn,
            dateOfBirth: isEncrypted(app.dateOfBirth) ? decrypt(app.dateOfBirth) : app.dateOfBirth,
        };
    }
}

export const applicationStore = new ApplicationStore();
