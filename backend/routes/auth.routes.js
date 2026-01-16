import express from 'express';
import cors from 'cors';
import { login, signup } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

export default router;