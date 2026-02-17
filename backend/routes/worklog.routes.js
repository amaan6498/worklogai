import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import {
    createLogSchema,
    updateTaskSchema,
    dateRangeSchema,
    aiSummarySchema
} from '../validators/workLog.schema.js';
import {
    addOrUpdateLog,
    getAllLogs,
    getLogByDate,
    getLogsByRange,
    getSummary,
    updateTask,
    getAiSummary,
    getWorklogStats,
    searchLogs,
    getStandup,
    deleteTask
} from '../controllers/workLog.controller.js';

const router = express.Router();
router.use(authMiddleware);

router.post("/", validate(createLogSchema), addOrUpdateLog);
router.get("/date/:date", getLogByDate);
router.get("/range/", validate(dateRangeSchema), getLogsByRange);
router.get("/ai-summary", validate(aiSummarySchema), getAiSummary);
router.post("/ai-summary", validate(aiSummarySchema), getAiSummary); // Support POST for body-based params
router.get("/summary", getSummary)
router.put("/task/:logId/:taskId", validate(updateTaskSchema), updateTask);
router.delete("/task/:logId/:taskId", deleteTask);
router.get("/stats", getWorklogStats);
router.get("/search", searchLogs);
router.get("/standup", getStandup);

// Specific pagination route (optional, or just use "/" with query params)
router.get("/", getAllLogs);

export default router;