import { Request, Response } from 'express';
import { manualAuthService } from 'src/services/oauth/manual';
import { googleAuthService } from 'src/services/oauth/google';

// Extend Express Request type to include the user type
declare global {
  namespace Express {
    interface User {
      _id: string;
      name: string;
      email: string;
      profilePicture?: string;
      status: string;
      isEmailVerified: boolean;
    }
  }
}

export class AuthController {
  /**
   * Register a new user with email and password
   */
  register(req: Request, res: Response): void {
    manualAuthService.handleSignUp(req, res);
  }

  /**
   * Login with email and password
   */
  login(req: Request, res: Response): void {
    manualAuthService.handleLogin(req, res);
  }

  /**
   * Logout the current user
   */
  logout(req: Request, res: Response): void {
    if (req.user) {
      req.logout(() => {
        res.status(200).json({ message: 'Logout successful' });
      });
    } else {
      res.status(200).json({ message: 'No user to logout' });
    }
  }

  /**
   * Start Google OAuth flow
   */
  googleAuth(req: Request, res: Response): void {
    googleAuthService.handleGoogleAuth(req, res);
  }

  /**
   * Handle Google OAuth callback
   */
  googleCallback(req: Request, res: Response): void {
    googleAuthService.handleGoogleCallback(req, res);
  }

  /**
   * Get current user information
   */
  getCurrentUser(req: Request, res: Response): void {
    if (req.user) {
      res.status(200).json({
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          profilePicture: req.user.profilePicture
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }

  /**
   * Check if the user is authenticated
   */
  checkAuth(req: Request, res: Response): void {
    if (req.isAuthenticated()) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  }
}

export default new AuthController();
