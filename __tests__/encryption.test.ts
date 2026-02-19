import { encrypt, decrypt, isEncrypted } from '@/lib/utils/encryption';

// Set test encryption key before tests run
beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'f34ac2cb0bf248dd600b31d979ac06d91af68bad22a07319d8993d4de941466f';
});

describe('Encryption Utility', () => {
    const testData = {
        ssn: '123-45-6789',
        dob: '1990-01-15',
    };

    describe('encrypt', () => {
        it('should encrypt a string and return hex format iv:tag:data', () => {
            const encrypted = encrypt(testData.ssn);

            // Should have 3 parts separated by colons
            const parts = encrypted.split(':');
            expect(parts).toHaveLength(3);

            // Each part should be hex
            parts.forEach(part => {
                expect(part).toMatch(/^[0-9a-f]+$/i);
            });

            // IV should be 32 hex chars (16 bytes)
            expect(parts[0]).toHaveLength(32);

            // Auth tag should be 32 hex chars (16 bytes)
            expect(parts[1]).toHaveLength(32);
        });

        it('should produce different ciphertext for same plaintext (random IV)', () => {
            const encrypted1 = encrypt(testData.ssn);
            const encrypted2 = encrypt(testData.ssn);

            expect(encrypted1).not.toBe(encrypted2);
        });
    });

    describe('decrypt', () => {
        it('should decrypt back to original plaintext', () => {
            const encrypted = encrypt(testData.ssn);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(testData.ssn);
        });

        it('should handle date strings', () => {
            const encrypted = encrypt(testData.dob);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(testData.dob);
        });

        it('should throw error for invalid format', () => {
            expect(() => decrypt('invalid-data')).toThrow('Invalid encrypted data format');
        });

        it('should throw error for tampered data', () => {
            const encrypted = encrypt(testData.ssn);
            const parts = encrypted.split(':');
            // Tamper with the encrypted data
            parts[2] = parts[2].replace(/[0-9a-f]/i, 'x');
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });
    });

    describe('isEncrypted', () => {
        it('should return true for encrypted strings', () => {
            const encrypted = encrypt(testData.ssn);
            expect(isEncrypted(encrypted)).toBe(true);
        });

        it('should return false for plain SSN', () => {
            expect(isEncrypted(testData.ssn)).toBe(false);
        });

        it('should return false for plain date', () => {
            expect(isEncrypted(testData.dob)).toBe(false);
        });

        it('should return false for random strings', () => {
            expect(isEncrypted('hello world')).toBe(false);
            expect(isEncrypted('')).toBe(false);
            expect(isEncrypted('a:b')).toBe(false);
        });
    });
});
