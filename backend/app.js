import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import logger from './utils/logger.js';
import limiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

const app = express();

app.set('trust proxy', 1); // Trust the first proxy (e.g., Render, Nginx)

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    // Add production domains here
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Body limit

const morganFormat = ':method :url :status :response-time ms';

app.use(
    morgan(morganFormat, {
        stream: {
            write: (message) => {
                const logObject = {
                    method: message.split(' ')[0],
                    url: message.split(' ')[1],
                    status: message.split(' ')[2],
                    responseTime: message.split(' ')[3],
                };
                logger.info(JSON.stringify(logObject));
            },
        },
    })
);

app.use(limiter);

import authRoutes from './routes/auth.routes.js';
import worklogRoutes from './routes/worklog.routes.js';
import tagsRoutes from './routes/tags.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/worklogs', worklogRoutes);
app.use('/api/tags', tagsRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;