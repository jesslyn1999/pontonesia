import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request, Response } from 'express';
import UserBasicInfoSchema from '../../models/user/basicInfo';
import userProfileGeneralSchema from '../../models/user/profile/general';
import { Types } from 'mongoose';
import { GOOGLE_AUTH } from '../../configs/env';

interface GoogleProfile {
    id: string;
    displayName: string;
    name?: {
        familyName?: string;
        givenName?: string;
    };
    emails?: Array<{
        value: string;
        verified: boolean;
    }>;
    photos?: Array<{
        value: string;
    }>;
    _json?: {
        locale?: string;
    };
}

export class GoogleAuthService {
    private static instance: GoogleAuthService;
    private readonly GOOGLE_CLIENT_ID = GOOGLE_AUTH.CLIENT_ID;
    private readonly GOOGLE_CLIENT_SECRET = GOOGLE_AUTH.CLIENT_SECRET;
    private readonly CALLBACK_URL = GOOGLE_AUTH.CALLBACK_URL;

    private constructor() {
        this.initializePassport();
    }

    public static getInstance(): GoogleAuthService {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }

    private initializePassport() {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: this.GOOGLE_CLIENT_ID,
                    clientSecret: this.GOOGLE_CLIENT_SECRET,
                    callbackURL: this.CALLBACK_URL,
                    proxy: true,
                },
                async (
                    accessToken: string,
                    refreshToken: string,
                    profile: GoogleProfile,
                    done: any
                ) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            return done(
                                new Error('No email found in Google profile')
                            );
                        }

                        // Check if user exists
                        let user = await UserBasicInfoSchema.findOne({ email });

                        if (!user) {
                            // Create new user
                            const userId = new Types.ObjectId();
                            user = await UserBasicInfoSchema.create({
                                _id: userId,
                                email,
                                name: profile.displayName,
                                profilePicture: profile.photos?.[0]?.value,
                                authProvider: 'google',
                                isEmailVerified: true, // Google emails are pre-verified
                                status: 'active',
                            });

                            // Create a general profile for the user
                            await userProfileGeneralSchema.create({
                                userId,
                                firstName:
                                    profile.name?.givenName ||
                                    profile.displayName.split(' ')[0],
                                lastName:
                                    profile.name?.familyName ||
                                    profile.displayName
                                        .split(' ')
                                        .slice(1)
                                        .join(' '),
                                profilePicture: profile.photos?.[0]?.value,
                                language: profile._json?.locale || 'en',
                            });
                        }

                        return done(null, user);
                    } catch (error) {
                        return done(error as Error);
                    }
                }
            )
        );

        // Serialize user for the session
        passport.serializeUser((user: any, done: any) => {
            done(null, user._id);
        });

        // Deserialize user from the session
        passport.deserializeUser(async (id: string, done: any) => {
            try {
                const user = await UserBasicInfoSchema.findById(id);
                done(null, user);
            } catch (error) {
                done(error);
            }
        });
    }

    async handleGoogleAuth(req: Request, res: Response) {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
        })(req, res);
    }

    async handleGoogleCallback(req: Request, res: Response) {
        passport.authenticate('google', (err, user) => {
            if (err) {
                console.error('Google authentication error:', err);
                return res.redirect('/login?error=authentication_failed');
            }

            if (!user) {
                return res.redirect('/login?error=user_not_found');
            }

            // Log the user in
            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.redirect('/login?error=login_failed');
                }

                // Redirect to frontend with success
                return res.redirect('/dashboard?success=true');
            });
        })(req, res);
    }

    async handleLogout(req: Request, res: Response) {
        req.logout(() => {
            res.redirect('/login');
        });
    }
}

export const googleAuthService = GoogleAuthService.getInstance();
