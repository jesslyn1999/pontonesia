import bcrypt from 'bcryptjs';
import { OAuthCredential, IOAuthCredential } from 'src/models/oauth/credential';
import { OAuthAccessToken } from 'src/models/oauth/accessToken';
import { AUTH_ENV } from 'src/configs/env';
import { generateToken } from 'src/libs/auth/token';
import { AuthError } from 'src/enums/errors';
import { AuthConfig, AuthCredentialStatus, AuthProvider } from 'src/enums/auth';

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userId: string; // Reference to UserBasicInfo
}

export interface SocialLoginData {
  email: string;
  firstName: string;
  lastName: string;
  provider: AuthProvider.GOOGLE | AuthProvider.FACEBOOK | AuthProvider.GITHUB;
  providerUserId: string;
  userId: string; // Reference to UserBasicInfo
}

export class CredentialService {
  /**
   * Register a new user with email and password
   */
  async registerUser(data: UserRegistrationData): Promise<IOAuthCredential> {
    // Check if user already exists
    const existingUser = await OAuthCredential.findOne({ email: data.email });
    if (existingUser) {
      throw AuthError.emailAlreadyRegistered(data.email);
    }

    // Hash password
    const salt = await bcrypt.genSalt(AUTH_ENV.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create new credential
    const credential = new OAuthCredential({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      provider: AuthProvider.LOCAL,
      status: AuthCredentialStatus.ACTIVE,
      failedLoginAttempts: 0,
      user: data.userId
    });

    return credential.save();
  }

  /**
   * Login user with email and password
   */
  async loginWithCredentials(email: string, password: string): Promise<{ credential: IOAuthCredential, token: string } | null> {
    // Find user by email
    const credential = await OAuthCredential.findOne({ email, provider: AuthProvider.LOCAL });
    if (!credential) {
      throw AuthError.invalidCredentials();
    }

    // Check if account is active
    if (credential.status === AuthCredentialStatus.INACTIVE) {
      throw AuthError.accountInactive();
    } else if (credential.status === AuthCredentialStatus.SUSPENDED) {
      throw AuthError.accountSuspended();
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, credential.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      credential.failedLoginAttempts += 1;
      if (credential.failedLoginAttempts >= AuthConfig.MAX_FAILED_LOGIN_ATTEMPTS) {
        credential.status = AuthCredentialStatus.SUSPENDED;
      }
      await credential.save();
      throw AuthError.invalidCredentials();
    }

    // Reset failed login attempts and update last login time
    credential.failedLoginAttempts = 0;
    credential.lastLoginAt = new Date();
    await credential.save();

    // Generate token
    const token = generateToken({ 
      userId: credential.user.toString(),
      email: credential.email
    });

    return { credential, token };
  }

  /**
   * Create or update user credentials for social login
   */
  async createSocialLogin(data: SocialLoginData): Promise<IOAuthCredential> {
    // Check if user with this provider and providerUserId exists
    let credential = await OAuthCredential.findOne({
      provider: data.provider,
      providerUserId: data.providerUserId
    });

    if (credential) {
      // Update existing credential
      credential.email = data.email;
      credential.firstName = data.firstName;
      credential.lastName = data.lastName;
      credential.lastLoginAt = new Date();
      return credential.save();
    }

    // Check if email is already registered
    credential = await OAuthCredential.findOne({ email: data.email });
    if (credential) {
      // If user exists with another provider, throw error
      if (credential.provider !== data.provider) {
        throw AuthError.emailProviderMismatch(data.email, credential.provider);
      }
    }

    // Create new credential
    credential = new OAuthCredential({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      provider: data.provider,
      providerUserId: data.providerUserId,
      status: AuthCredentialStatus.ACTIVE,
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
      user: data.userId
    });

    return credential.save();
  }

  /**
   * Find credential by email
   */
  async findByEmail(email: string): Promise<IOAuthCredential | null> {
    return OAuthCredential.findOne({ email });
  }

  /**
   * Find credential by user ID
   */
  async findByUserId(userId: string): Promise<IOAuthCredential | null> {
    return OAuthCredential.findOne({ user: userId });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<IOAuthCredential | null> {
    const credential = await OAuthCredential.findOne({ user: userId, provider: 'local' });
    if (!credential) {
      return null;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(AUTH_ENV.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    credential.password = hashedPassword;
    
    // Reset password reset fields if they exist
    credential.passwordResetToken = undefined;
    credential.passwordResetExpires = undefined;

    return credential.save();
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const credential = await OAuthCredential.findOne({ email, provider: 'local' });
    if (!credential) {
      throw AuthError.invalidCredentials();
    }

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Set token and expiry (1 hour from now)
    credential.passwordResetToken = token;
    credential.passwordResetExpires = new Date(Date.now() + 3600000);
    
    await credential.save();
    return token;
  }

  /**
   * Reset password using token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<IOAuthCredential | null> {
    const credential = await OAuthCredential.findOne({
      passwordResetToken: token
    });

    if (!credential) {
      throw AuthError.passwordResetInvalid();
    }

    // Check if token has expired
    if (!credential.passwordResetExpires || credential.passwordResetExpires < new Date()) {
      throw AuthError.passwordResetExpired();
    }

    // Hash new password
    const salt = await bcrypt.genSalt(AUTH_ENV.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    credential.password = hashedPassword;
    credential.passwordResetToken = undefined;
    credential.passwordResetExpires = undefined;

    return credential.save();
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllTokens(userId: string): Promise<boolean> {
    try {
      await OAuthAccessToken.deleteMany({ user: userId });
      return true;
    } catch (error) {
      throw AuthError.serverError('Failed to revoke tokens');
    }
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(userId: string): Promise<IOAuthCredential | null> {
    const credential = await OAuthCredential.findOne({ user: userId });
    if (!credential) {
      return null;
    }

    credential.status = AuthCredentialStatus.INACTIVE;
    await this.revokeAllTokens(userId);
    
    return credential.save();
  }
}
