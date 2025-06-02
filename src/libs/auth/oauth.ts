import OAuth2Server from 'oauth2-server';
import {
    Express,
    Request as ExpressRequest,
    Response as ExpressResponse,
    NextFunction,
} from 'express';
import bcrypt from 'bcryptjs';
import UserBasicInfoSchema from '../../models/user/basicInfo';
import { AUTH_ENV } from '../../configs/env';

// Add the CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI to the AUTH object if it doesn't exist
interface OAuthConfig {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URI: string;
}

// Combine the AUTH config with our custom OAuthConfig
const OAuthSettings: OAuthConfig = {
    CLIENT_ID: process.env.OAUTH_CLIENT_ID || 'default-client',
    CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET || 'default-secret',
    REDIRECT_URI:
        process.env.OAUTH_REDIRECT_URI ||
        'http://localhost:3000/oauth/callback',
};

// OAuth request and response wrapper
const OAuthRequest = OAuth2Server.Request;
const OAuthResponse = OAuth2Server.Response;

// OAuth model implementation
const model = {
    // Required for all grant types
    getClient: async (clientId: string, clientSecret: string) => {
        // For simplicity, using a hardcoded client
        // In a real app, this would be stored in the database
        const clients: Record<string, any> = {
            [OAuthSettings.CLIENT_ID]: {
                id: OAuthSettings.CLIENT_ID,
                clientSecret: OAuthSettings.CLIENT_SECRET,
                grants: ['password', 'refresh_token', 'authorization_code'],
                redirectUris: [OAuthSettings.REDIRECT_URI],
            },
        };

        const client = clients[clientId];
        if (!client || (clientSecret && client.clientSecret !== clientSecret)) {
            return false;
        }

        return client;
    },

    // User credentials (password) grant
    getUser: async (username: string, password: string) => {
        try {
            const user = await UserBasicInfoSchema.findOne({
                email: username,
            }).exec();

            if (!user) {
                return false;
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return false;
            }

            // Check if account is active
            if (user.status !== 'active') {
                return false;
            }

            return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            };
        } catch (error) {
            console.error('Error in getUser:', error);
            return false;
        }
    },

    // Required for token generation
    saveToken: async (
        token: OAuth2Server.Token,
        client: OAuth2Server.Client,
        user: OAuth2Server.User
    ) => {
        // In a real application, you would save this token to your database
        // For simplicity, we'll create an in-memory token
        const accessToken: OAuth2Server.Token = {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            client: client,
            user: user,
            scope: token.scope,
        };

        if (token.refreshToken) {
            Object.assign(accessToken, {
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            });
        }

        // In a real app, return the saved token from the database
        return accessToken;
    },

    // Get access token (for token validation)
    getAccessToken: async (accessToken: string) => {
        // In a real app, retrieve token from database
        // For demo purposes, we return null to indicate no token found
        // (this would need to be implemented with proper storage)
        return null;
    },

    // Refresh token grant
    getRefreshToken: async (refreshToken: string) => {
        // In a real app, retrieve refresh token from database
        // For demo purposes, we return null to indicate no token found
        // (this would need to be implemented with proper storage)
        return null;
    },

    // Authorization code grant
    getAuthorizationCode: async (authorizationCode: string) => {
        // In a real app, retrieve authorization code from database
        // For demo purposes, we return null
        return null;
    },

    // Revoke tokens
    revokeToken: async (token: OAuth2Server.Token) => {
        // In a real app, revoke token in database
        // For demo purposes, we return true to indicate successful revocation
        return true;
    },

    // Save authorization code
    saveAuthorizationCode: async (
        code: OAuth2Server.AuthorizationCode,
        client: OAuth2Server.Client,
        user: OAuth2Server.User
    ) => {
        // In a real app, save authorization code to database
        // For demo purposes, we return the code object
        return {
            authorizationCode: code.authorizationCode,
            expiresAt: code.expiresAt,
            redirectUri: code.redirectUri,
            scope: code.scope,
            client: client,
            user: user,
        };
    },
};

// Extend Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const configureOAuth = (app: Express): void => {
    // Create OAuth server
    const oauth = new OAuth2Server({
        model,
        accessTokenLifetime: 60 * 60, // 1 hour
        refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks
        allowBearerTokensInQueryString: true,
        allowExtendedTokenAttributes: true,
    });

    // Token endpoint
    app.post('/oauth/token', (req: ExpressRequest, res: ExpressResponse) => {
        const request = new OAuthRequest(req);
        const response = new OAuthResponse(res);

        oauth
            .token(request, response)
            .then((token) => {
                res.json(token);
            })
            .catch((err) => {
                res.status(err.code || 500).json(err);
            });
    });

    // Authorization endpoint
    app.all('/oauth/authorize', (req: ExpressRequest, res: ExpressResponse) => {
        // In a real app, you would show a login page and authorization screen
        if (!req.session.user) return res.redirect('/login');
        const request = new OAuthRequest(req);
        const response = new OAuthResponse(res);
        oauth
            .authorize(request, response, {
                authenticateHandler: { handle: () => req.session.user },
            })
            .then((code) => {
                res.redirect(
                    `${code.redirectUri}?code=${code.authorizationCode}`
                );
            })
            .catch((err) => res.status(err.code || 500).json(err));

        // For simplicity, this is not implemented here
        res.status(501).json({ error: 'Not implemented' });
    });

    // Protected resource middleware
    const authenticateHandler = (
        req: ExpressRequest,
        res: ExpressResponse,
        next: NextFunction
    ) => {
        const request = new OAuthRequest(req);
        const response = new OAuthResponse(res);

        oauth
            .authenticate(request, response)
            .then((token: OAuth2Server.Token) => {
                // Make token data available to downstream middleware
                req.user = token.user;
                console.log({
                    message: 'Protected resource accessed',
                    user: token.user,
                }); //TODO: Remove this
                next();
            })
            .catch((err) => {
                res.status(err.code || 500).json(err);
            });
    };

    // Export the middleware for protected routes
    app.use('/api/protected', authenticateHandler);
};
