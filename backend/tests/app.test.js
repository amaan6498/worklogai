import { jest } from '@jest/globals';

// Mock OpenAI before importing app
jest.unstable_mockModule('openai', () => {
    return {
        default: class OpenAI {
            constructor() {
                this.chat = {
                    completions: {
                        create: jest.fn().mockResolvedValue({
                            choices: [{ message: { content: 'Mocked summary' } }],
                        }),
                    },
                };
            }
        },
    };
});

// Import app and request after mocking
const { default: app } = await import('../app.js');
const { default: request } = await import('supertest');

describe('Backend API Tests', () => {
    beforeAll(async () => {
        // Setup text encoder/decoder if needed for some envs, but likely fine here
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
