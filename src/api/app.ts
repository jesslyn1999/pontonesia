import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';
import bluebird from 'bluebird';
import bodyParser from 'body-parser';
import * as OpenApiValidator from 'express-openapi-validator';

import { configurePassport } from 'src/libs/auth/passport';
import { SERVER_ENV, DATABASE_ENV } from 'src/configs/env';
// import { authRateLimiter } from 'src/middlewares/auth';

export default class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.connectToDatabase();
        this.setupPassport();
    }

    private config(): void {
        const app = this.app;

        // Basic middleware
        app.use(bodyParser.json({ limit: SERVER_ENV.REQUEST_LIMIT }));
        app.use(
            bodyParser.urlencoded({
                extended: true,
                limit: SERVER_ENV.REQUEST_LIMIT,
            })
        );
        app.use(cookieParser(SERVER_ENV.SESSION_SECRET));
        app.use(compression());

        // Security middleware
        app.use(helmet());
        app.use(
            cors({
                origin: SERVER_ENV.CORS_ORIGIN,
                credentials: true,
            })
        );

        // Request logging
        app.use(
            morgan(SERVER_ENV.NODE_ENV === 'production' ? 'combined' : 'dev')
        );
        // app.use(morgan('tiny'));

        // Static files
        const root = path.normalize(__dirname);
        app.use(express.static(path.join(root, 'public')));

        // Serve uploaded images
        app.use(
            '/uploads',
            express.static(path.join(process.cwd(), 'uploads'))
        );

        // Others
        const apiSpec = path.join(__dirname, 'api.yml');
        const validateResponses = SERVER_ENV.OPENAPI_ENABLE_RESPONSE_VALIDATION;
        app.use(SERVER_ENV.OPENAPI_SPEC || '/spec', express.static(apiSpec));
        // app.use(
        //     OpenApiValidator.middleware({
        //         apiSpec,
        //         validateResponses,
        //         ignorePaths: /.*\/spec(\/|$)/,
        //     })
        // );
    }

    private connectToDatabase(): void {
        mongoose.Promise = bluebird;
        mongoose
            .connect(DATABASE_ENV.URL)
            .then(() => {
                console.log('Connected to MongoDB');
            })
            .catch((err) => {
                console.error('MongoDB connection error:', err);
                process.exit(1);
            });
    }

    private setupPassport(): void {
        // configurePassport(this.app);
    }
}
