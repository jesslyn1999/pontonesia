import jwt from 'jsonwebtoken';
import { AUTH_ENV } from 'src/configs/env';

interface TokenPayload {
  userId: string;
  email: string;
  [key: string]: any;
}

/**
 * Generate JWT token for authentication
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, AUTH_ENV.JWT_SECRET, {
    expiresIn: AUTH_ENV.JWT_EXPIRES_IN
  });
};

/**
 * Verify JWT token and return decoded payload
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, AUTH_ENV.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from authorization header
 */
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}; 