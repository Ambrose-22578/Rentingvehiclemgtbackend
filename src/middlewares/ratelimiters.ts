import { rateLimiter } from "hono-rate-limiter";

export const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 15 minutes
  limit: 100, 
  standardHeaders: "draft-6", // draft-6: RateLimit-* headers; draft-7: combined RateLimit header
   keyGenerator: () => "<unique_key>", // Method to generate custom identifiers for clients.
  
});