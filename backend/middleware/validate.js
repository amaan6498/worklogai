import AppError from '../utils/AppError.js';
import { z } from 'zod';

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            return next(new AppError(`Validation failed. ${errors.join(', ')}`, 400));
        }
        next(err);
    }
};

export default validate;
