import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash works
const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory fallback map (IP -> timestamps array)
const fallbackCache = new Map<string, number[]>();

// Clean up memory cache periodically (every 5 mins) to prevent memory leaks over time
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        fallbackCache.forEach((timestamps, key) => {
            const validTimestamps = timestamps.filter(t => now - t < 3600000); // Max 1 hr window
            if (validTimestamps.length === 0) {
                fallbackCache.delete(key);
            } else {
                fallbackCache.set(key, validTimestamps);
            }
        });
    }, 300000); // 5 mins
}

export const rateLimit = async (identifier: string, limit = 5, windowS = 60) => {
    if (hasUpstash) {
        try {
            const redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL!,
                token: process.env.UPSTASH_REDIS_REST_TOKEN!,
            });

            const ratelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(limit, `${windowS} s`),
                analytics: true,
            });

            const { success } = await ratelimit.limit(identifier);
            return success;
        } catch (error) {
            console.warn('Upstash rate limit error, falling back to memory:', error);
            // Fallthrough to memory
        }
    }

    // In-memory fallback
    const now = Date.now();
    const windowMs = windowS * 1000;

    let timestamps = fallbackCache.get(identifier) || [];

    // Clean up old timestamps
    timestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (timestamps.length >= limit) {
        return false; // Rate limited
    }

    timestamps.push(now);
    fallbackCache.set(identifier, timestamps);

    return true; // Allowed
};
