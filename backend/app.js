import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger.js';
import limiter from './middleware/rateLimiter.js';

const app = express();

app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
    res.send('API is running...');
});

export default app;