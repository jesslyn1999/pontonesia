import { Request, Response, NextFunction } from 'express';
import { SERVER_ENV } from 'src/configs/env';

export default function errorHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const errors = err.errors || [{ message: err.message }];
    res.status(err.status || 500).json({ errors });

    /*
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        stack:
            SERVER_ENV.NODE_ENV === 'development'
                ? err.stack
                : undefined,
    });
    */
}
