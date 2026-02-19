import { RateLimiter } from '@/lib/utils/rateLimiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        // Create a fresh limiter for each test: 3 requests per 1 second
        limiter = new RateLimiter(3, 1000);
    });

    describe('check', () => {
        it('should allow requests under the limit', () => {
            const result = limiter.check('test-ip');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);
        });

        it('should track remaining requests correctly', () => {
            limiter.check('test-ip'); // 1st request
            const result = limiter.check('test-ip'); // 2nd request

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it('should block requests when limit is exceeded', () => {
            limiter.check('test-ip'); // 1st
            limiter.check('test-ip'); // 2nd
            limiter.check('test-ip'); // 3rd

            const result = limiter.check('test-ip'); // 4th - should be blocked

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should track different IPs separately', () => {
            // Exhaust limit for ip1
            limiter.check('ip1');
            limiter.check('ip1');
            limiter.check('ip1');
            const ip1Result = limiter.check('ip1');

            // ip2 should still have full limit
            const ip2Result = limiter.check('ip2');

            expect(ip1Result.allowed).toBe(false);
            expect(ip2Result.allowed).toBe(true);
            expect(ip2Result.remaining).toBe(2);
        });

        it('should include resetTime in response', () => {
            const before = Date.now();
            const result = limiter.check('test-ip');
            const after = Date.now();

            expect(result.resetTime).toBeGreaterThanOrEqual(before + 1000);
            expect(result.resetTime).toBeLessThanOrEqual(after + 1000);
        });
    });

    describe('reset', () => {
        it('should reset the limit for a specific identifier', () => {
            limiter.check('test-ip');
            limiter.check('test-ip');
            limiter.check('test-ip');

            // Should be blocked
            expect(limiter.check('test-ip').allowed).toBe(false);

            // Reset
            limiter.reset('test-ip');

            // Should be allowed again
            const result = limiter.check('test-ip');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);
        });
    });

    describe('clear', () => {
        it('should clear all rate limit entries', () => {
            limiter.check('ip1');
            limiter.check('ip1');
            limiter.check('ip1');
            limiter.check('ip2');
            limiter.check('ip2');

            limiter.clear();

            // Both should be reset
            expect(limiter.check('ip1').remaining).toBe(2);
            expect(limiter.check('ip2').remaining).toBe(2);
        });
    });

    describe('window expiration', () => {
        it('should reset after window expires', async () => {
            // Use a very short window for testing
            const shortLimiter = new RateLimiter(2, 100); // 100ms window

            shortLimiter.check('test-ip');
            shortLimiter.check('test-ip');

            // Should be blocked
            expect(shortLimiter.check('test-ip').allowed).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be allowed again
            const result = shortLimiter.check('test-ip');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });
    });
});
