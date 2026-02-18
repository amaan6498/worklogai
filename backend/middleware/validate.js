import AppError from '../utils/AppError.js';
import { z } from 'zod';

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body || {},
            query: req.query || {},
            params: req.params || {},
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            let errorMessages;

            if (err.errors) {
                errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            } else {
                // Fallback for Zod versions where errors are serialized in message
                try {
                    const parsed = JSON.parse(err.message);
                    if (Array.isArray(parsed)) {
                        errorMessages = parsed.map((e) => `${e.path && Array.isArray(e.path) ? e.path.join('.') : 'field'}: ${e.message}`);
                    } else {
                        errorMessages = [err.message];
                    }
                } catch {
                    errorMessages = [err.message];
                }
            }

            return next(new AppError(`Validation failed. ${errorMessages.join(', ')}`, 400));
        }
        next(err);
    }
};

export default validate;
