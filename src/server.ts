import App from './app';
import { SERVER_ENV } from './configs/env';

const app = new App().app;
const port = SERVER_ENV.PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Environment: ${SERVER_ENV.NODE_ENV}`);
    console.log(`App ID: ${SERVER_ENV.APP_ID}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
