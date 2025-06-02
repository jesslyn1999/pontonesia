import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Application } from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import UserBasicInfoSchema from 'src/models/user/basicInfo';
import { AUTH_ENV, GOOGLE_AUTH, SERVER_ENV } from 'src/configs/env';

export const configurePassport = (app: Application): void => {
    // Configure express-session
    app.use(
        session({
            secret: SERVER_ENV.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                secure: SERVER_ENV.NODE_ENV === 'production',
                httpOnly: true,
            },
        })
    );

    // Initialize passport and session
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure JWT Strategy
    passport.use(
        new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: AUTH.JWT_SECRET,
            },
            async (jwtPayload, done) => {
                try {
                    const user = await UserBasicInfoSchema.findById(
                        jwtPayload.userId
                    );
                    if (!user) {
                        return done(null, false);
                    }
                    return done(null, user);
                } catch (error) {
                    return done(error, false);
                }
            }
        )
    );

    // Configure Local Strategy (username/password)
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const user = await UserBasicInfoSchema.findOne({ email });
                    if (!user) {
                        return done(null, false, {
                            message: 'Invalid email or password',
                        });
                    }

                    // Verify password
                    const isMatch = await bcrypt.compare(
                        password,
                        user.password
                    );
                    if (!isMatch) {
                        return done(null, false, {
                            message: 'Invalid email or password',
                        });
                    }

                    // Check if account is active
                    if (user.status !== 'active') {
                        return done(null, false, {
                            message: 'Account is not active',
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Configure Google Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_AUTH.CLIENT_ID,
                clientSecret: GOOGLE_AUTH.CLIENT_SECRET,
                callbackURL: GOOGLE_AUTH.CALLBACK_URL,
                proxy: true,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(
                            new Error('No email found in Google profile')
                        );
                    }

                    // Check if user exists
                    let user = await UserBasicInfoSchema.findOne({ email });

                    if (user) {
                        return done(null, user);
                    }

                    // If we're here, we need to create a new user - this would normally be handled
                    // in the googleAuthService but we're duplicating some logic here
                    // to ensure Passport has everything it needs
                    return done(null, false, { message: 'User not found' });
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Serialize user into the session
    passport.serializeUser((user: any, done) => {
        done(null, user._id);
    });

    // Deserialize user from the session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await UserBasicInfoSchema.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
