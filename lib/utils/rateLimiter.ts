/**
 * Simple in-memory rate limiter using sliding window.
 * Tracks requests per IP address within a time window.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private requests = new Map<string, RateLimitEntry>();
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Create a rate limiter.
     * @param maxRequests - Maximum requests allowed per window
     * @param windowMs - Time window in milliseconds
     * @param enableCleanup - Enable periodic cleanup (disable for testing)
     */
    constructor(maxRequests: number = 10, windowMs: number = 60 * 1000, enableCleanup: boolean = true) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;

        // Clean up expired entries every minute (only for production use)
        if (enableCleanup && windowMs >= 60 * 1000) {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
            // Prevent interval from keeping Node.js alive
            this.cleanupInterval.unref();
        }
    }

    /**
     * Check if a request is allowed for the given identifier (e.g., IP address).
     * @param identifier - Unique identifier for the client (IP address)
     * @returns Object with allowed status and remaining requests
     */
    check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = this.requests.get(identifier);

        // If no entry or window has expired, start fresh
        if (!entry || now >= entry.resetTime) {
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime: now + this.windowMs,
            };
        }

        // Check if limit exceeded
        if (entry.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        // Increment count
        entry.count++;
        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Clean up expired entries to prevent memory leaks.
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now >= entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Reset rate limit for a specific identifier (useful for testing).
     */
    reset(identifier: string): void {
        this.requests.delete(identifier);
    }

    /**
     * Clear all rate limit entries (useful for testing).
     */
    clear(): void {
        this.requests.clear();
    }
}

// Default rate limiter: 10 requests per minute per IP
export const applicationRateLimiter = new RateLimiter(10, 60 * 1000);

// Export class for custom configurations
export { RateLimiter };
