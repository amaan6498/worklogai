import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
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
    getStandup
} from '../controllers/workLog.controller.js';

const router = express.Router();
router.use(authMiddleware);

router.get("/", getAllLogs);
router.post("/", addOrUpdateLog);
router.get("/date/:date", getLogByDate);
router.get("/range/", getLogsByRange);
router.get("/ai-summary", getAiSummary);
router.get("/summary", getSummary)
router.put("/task/:logId/:taskId", updateTask);
router.post("/ai-summary", getAiSummary);
router.get("/stats", getWorklogStats);
router.get("/search", searchLogs);
router.get("/standup", getStandup);

export default router;