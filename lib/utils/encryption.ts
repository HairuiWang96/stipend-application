import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable.
 * Key must be 32 bytes (256 bits) for AES-256.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // If key is hex encoded (64 chars = 32 bytes)
    if (key.length === 64) {
        return Buffer.from(key, 'hex');
    }

    // If key is base64 encoded
    if (key.length === 44) {
        return Buffer.from(key, 'base64');
    }

    // If key is plain string, hash it to get 32 bytes
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt sensitive data using AES-256-GCM.
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt data that was encrypted with encrypt().
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

/**
 * Check if a string appears to be encrypted (matches our format).
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(':');
    if (parts.length !== 3) return false;

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Check if all parts are valid hex
    const hexRegex = /^[0-9a-f]+$/i;
    return (
        hexRegex.test(ivHex) &&
        hexRegex.test(authTagHex) &&
        hexRegex.test(encryptedHex) &&
        ivHex.length === IV_LENGTH * 2 &&
        authTagHex.length === TAG_LENGTH * 2
    );
}
