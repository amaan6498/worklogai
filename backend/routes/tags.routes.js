import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { getAllTags, renameTag, deleteTag } from '../controllers/tags.controller.js';

const router = express.Router();
router.use(authMiddleware);

router.get("/", getAllTags);
router.put("/rename", renameTag); // Using /rename explicit path to avoid conflict with params if any
router.delete("/:tag", deleteTag);

export default router;
