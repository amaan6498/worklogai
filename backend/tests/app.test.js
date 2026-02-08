import request from 'supertest';
import app from '../app.js'; // Adjust path if needed
import mongoose from 'mongoose';

describe('Backend API Tests', () => {
    beforeAll(async () => {
        // Avoid connecting to real DB in tests if possible, or use a test DB
        // For this simple health check, we might not need DB, but app.js likely connects it.
        // If app.js calls connectDB(), we might need to handle connection/disconnection.
        // However, app.js usually imports connectDB but calls it in server.js, so app.js is safe?
        // Let's check app.js again. server.js does the connection. app.js just exports app.
    });

    afterAll(async () => {
        // Close any open handles
    });

    it('GET / should return 200 and running message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('API is running...');
    });
});
