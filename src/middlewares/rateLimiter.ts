import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthError, AuthErrorCode } from '../errors';

/**
 * Rate limiter for authentication routes
 * Prevents brute force attacks by limiting the number of requests
 * from a single IP address in a given time window
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Only count failed requests
  
  // Custom handler for when rate limit is exceeded
  handler: (req: Request, res: Response) => {
    const error = new AuthError({
      code: AuthErrorCode.TOO_MANY_ATTEMPTS,
      message: 'Too many login attempts, please try again later',
      httpStatus: 429,
      details: {
        retryAfter: Math.ceil(15 * 60), // seconds
        remainingMs: res.getHeader('RateLimit-Reset') as number
      }
    });

    res.status(429).json({
      status: 'error',
      error: {
        code: error.code,
        message: error.message
      }
    });
  },
  
  // Skip rate limiting for certain paths or conditions
  skip: (req: Request) => {
    // Skip rate limiting for password reset endpoints
    return req.path.includes('/reset-password') || req.path.includes('/forgot-password');
  }
});

/**
 * More aggressive rate limiter specifically for login endpoints
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  
  handler: (req: Request, res: Response) => {
    const error = new AuthError({
      code: AuthErrorCode.TOO_MANY_ATTEMPTS,
      message: 'Too many login attempts, please try again after an hour',
      httpStatus: 429,
      details: {
        retryAfter: Math.ceil(60 * 60), // seconds
        remainingMs: res.getHeader('RateLimit-Reset') as number
      }
    });

    res.status(429).json({
      status: 'error',
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
});

/**
 * Generic API rate limiter for other endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
}); 