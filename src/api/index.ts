// For production compiled code
if (process.env.NODE_ENV === 'production') {
    require('module-alias/register');
}

import '../configs/env';
import Server from './server';
import Router from './router';

const port = parseInt(process.env.PORT ?? '3000');
const app = new Server().router(Router);
app.listen(port);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
