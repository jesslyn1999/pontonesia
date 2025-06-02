export enum AuthErrorCode {
  // Registration errors
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  INVALID_REGISTRATION_DATA = 'INVALID_REGISTRATION_DATA',
  
  // Login errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  
  // Token errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  
  // Password errors
  PASSWORD_RESET_EXPIRED = 'PASSWORD_RESET_EXPIRED',
  PASSWORD_RESET_INVALID = 'PASSWORD_RESET_INVALID',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  
  // Social login errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  EMAIL_PROVIDER_MISMATCH = 'EMAIL_PROVIDER_MISMATCH',
  
  // Other errors
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN'
}

export interface AuthErrorDetails {
  code: AuthErrorCode;
  message: string;
  httpStatus: number;
  details?: Record<string, any>;
}

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, any>;

  constructor(errorDetails: AuthErrorDetails) {
    super(errorDetails.message);
    this.name = 'AuthError';
    this.code = errorDetails.code;
    this.httpStatus = errorDetails.httpStatus;
    this.details = errorDetails.details;
    
    // Capturing stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  // Predefined error creators for common auth errors
  
  static emailAlreadyRegistered(email: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.EMAIL_ALREADY_REGISTERED,
      message: `Email ${email} is already registered`,
      httpStatus: 409, // Conflict
      details: { email }
    });
  }

  static invalidCredentials(): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
      httpStatus: 401 // Unauthorized
    });
  }

  static accountInactive(): AuthError {
    return new AuthError({
      code: AuthErrorCode.ACCOUNT_INACTIVE,
      message: 'Account is inactive',
      httpStatus: 403 // Forbidden
    });
  }

  static accountSuspended(): AuthError {
    return new AuthError({
      code: AuthErrorCode.ACCOUNT_SUSPENDED,
      message: 'Account is suspended due to too many failed login attempts',
      httpStatus: 403 // Forbidden
    });
  }

  static invalidToken(): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_TOKEN,
      message: 'Invalid authentication token',
      httpStatus: 401 // Unauthorized
    });
  }

  static expiredToken(): AuthError {
    return new AuthError({
      code: AuthErrorCode.EXPIRED_TOKEN,
      message: 'Authentication token has expired',
      httpStatus: 401 // Unauthorized
    });
  }

  static missingToken(): AuthError {
    return new AuthError({
      code: AuthErrorCode.MISSING_TOKEN,
      message: 'Authentication token is required',
      httpStatus: 401 // Unauthorized
    });
  }

  static passwordResetExpired(): AuthError {
    return new AuthError({
      code: AuthErrorCode.PASSWORD_RESET_EXPIRED,
      message: 'Password reset token has expired',
      httpStatus: 400 // Bad Request
    });
  }

  static passwordResetInvalid(): AuthError {
    return new AuthError({
      code: AuthErrorCode.PASSWORD_RESET_INVALID,
      message: 'Invalid password reset token',
      httpStatus: 400 // Bad Request
    });
  }

  static passwordTooWeak(): AuthError {
    return new AuthError({
      code: AuthErrorCode.PASSWORD_TOO_WEAK,
      message: 'Password does not meet security requirements',
      httpStatus: 400, // Bad Request
      details: {
        requirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true
        }
      }
    });
  }

  static emailProviderMismatch(email: string, provider: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.EMAIL_PROVIDER_MISMATCH,
      message: `Email ${email} is already registered with ${provider}`,
      httpStatus: 409, // Conflict
      details: { email, provider }
    });
  }

  static serverError(message: string = 'Internal server error'): AuthError {
    return new AuthError({
      code: AuthErrorCode.SERVER_ERROR,
      message,
      httpStatus: 500 // Internal Server Error
    });
  }

  static unauthorized(message: string = 'Unauthorized'): AuthError {
    return new AuthError({
      code: AuthErrorCode.UNAUTHORIZED,
      message,
      httpStatus: 401 // Unauthorized
    });
  }

  static forbidden(message: string = 'Forbidden'): AuthError {
    return new AuthError({
      code: AuthErrorCode.FORBIDDEN,
      message,
      httpStatus: 403 // Forbidden
    });
  }
} 