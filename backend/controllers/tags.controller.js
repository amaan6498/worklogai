import WorkLog from "../models/Worklog.js";
import mongoose from "mongoose";

/**
 * Get all unique tags used by the user across all logs.
 */
export const getAllTags = async (req, res) => {
    try {
        const userId = req.user.id;

        const tags = await WorkLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // Cast string ID to ObjectId for aggregation
            // Note: in schema userId is ObjectId, req.user.id is string usually from JWT, mongoose handles casting usually but in aggregate we must cast
            { $unwind: "$tasks" },
            { $unwind: "$tasks.tags" },
            {
                $group: {
                    _id: "$tasks.tags",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Returns array of { _id: "TagName", count: 10 }
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Rename a tag globally.
 * Body: { oldTag: "Frontend", newTag: "FE" }
 */
export const renameTag = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldTag, newTag } = req.body;

        if (!oldTag || !newTag) {
            return res.status(400).json({ message: "Old and New tags are required" });
        }

        // We need to find all logs where tasks.tags contains oldTag
        // And update specific array element. 
        // using arrayFilters is the most robust way for nested arrays
        const result = await WorkLog.updateMany(
            { userId, "tasks.tags": oldTag },
            { $set: { "tasks.$[].tags.$[tag]": newTag } },
            {
                arrayFilters: [{ "tag": oldTag }]
            }
        );

        res.status(200).json({ message: "Tag renamed", result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a tag globally.
 * Params: tag (string)
 */
export const deleteTag = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tag } = req.params;

        if (!tag) return res.status(400).json({ message: "Tag is required" });

        const result = await WorkLog.updateMany(
            { userId, "tasks.tags": tag },
            { $pull: { "tasks.$[].tags": tag } }
        );

        res.status(200).json({ message: "Tag deleted", result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
