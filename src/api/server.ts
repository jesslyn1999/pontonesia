import express, { Application } from 'express';
import http from 'http';
import os from 'os';
import App from './app';
import errorHandler from 'src/middlewares/error.handler';
import logger from 'src/libs/logger';

import { SERVER_ENV } from 'src/configs/env';
import notFoundHandler from 'src/middlewares/notFound.handler';
import { Container } from 'inversify';
import ioc from './ioc/ioc.config';

export default class AppServer {
    public app: express.Application;
    public container: Container;
    private routes: (app: Application, container: Container) => void;

    constructor() {
        this.app = new App().app;
        this.container = new Container(); // dependency injection
        ioc(this.container);
    }

    router(
        routes: (app: Application, container: Container) => void
    ): AppServer {
        // Root route
        this.app.get('/', (_req, res) => {
            res.json({
                app: SERVER_ENV.APP_ID,
                version: process.env.npm_package_version || '1.0.0',
            });
        });
        routes(this.app, this.container);
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
        return this;
    }

    listen(port: number): Application {
        const welcome = (p: number) => (): void => {
            logger.info(
                `up and running in ${
                    process.env.NODE_ENV || 'development'
                } @: ${os.hostname()} on port: ${p}}`
            );
            logger.info(`Environment: ${SERVER_ENV.NODE_ENV}`);
            logger.info(`App ID: ${SERVER_ENV.APP_ID}`);
        };

        http.createServer(this.app).listen(port, welcome(port));

        return this.app;
    }
}
