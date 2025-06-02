import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'mongodb://localhost:27017/pontonesia_test';

// Global test setup
before(async function () {
    this.timeout(10000); // Increase timeout for database operations

    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.DATABASE_URL!);
            console.log('Connected to test database');
        } catch (error) {
            console.error('Failed to connect to test database:', error);
            throw error;
        }
    }
});

// Global test teardown
after(async function () {
    this.timeout(10000);

    // Close database connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Disconnected from test database');
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export {};
