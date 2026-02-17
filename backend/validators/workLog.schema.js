import { z } from 'zod';

export const createLogSchema = z.object({
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        content: z.string().min(1, 'Content cannot be empty'),
    }),
});

export const updateTaskSchema = z.object({
    params: z.object({
        logId: z.string().min(1, 'Log ID is required'),
        taskId: z.string().min(1, 'Task ID is required'),
    }),
    body: z.object({
        content: z.string().min(1, 'Content cannot be empty'),
        tags: z.array(z.string()).optional(),
    }),
});

export const dateRangeSchema = z.object({
    query: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD').optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD').optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    }).refine((data) => {
        // If one exists, the other must exist (for range)
        if ((data.from && !data.to) || (!data.from && data.to)) {
            return false;
        }
        return true;
    }, {
        message: "Both 'from' and 'to' dates are required for a range query",
        path: ['query'],
    }),
});

export const aiSummarySchema = z.object({
    body: z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
    }),
    query: z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
    }),
});
