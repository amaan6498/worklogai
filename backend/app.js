import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes.js';
import worklogRoutes from './routes/worklog.routes.js';

app.use('/api/auth', authRoutes);

app.use('/api/worklogs', worklogRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

export default app;