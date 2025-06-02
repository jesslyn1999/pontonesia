import { Request, Response, NextFunction } from 'express';
import { SERVER_ENV } from 'src/configs/env';

export default function notFoundHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    res.status(404).json({ error: 'Not found' });

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
