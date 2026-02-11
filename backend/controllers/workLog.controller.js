import WorkLog from "../models/Worklog.js";
import ExcelJS from "exceljs";
import OpenAI from "openai";

const ai = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_ACCESS_TOKEN,
});

/**
 * Generate an AI-powered summary of work logs for a given date range.
 * This uses the Hugging Face Inference Router (via OpenAI SDK) to summarize tasks.
 * Query Params: start (YYYY-MM-DD), end (YYYY-MM-DD)
 */
export const getAiSummary = async (req, res) => {
  try {
    // Support both GET (query) and POST (body)
    const startStr = req.query.start || req.body.start;
    const endStr = req.query.end || req.body.end;
    const userId = req.user.id;

    if (!startStr || !endStr) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    const logs = await WorkLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // 1. Identify Missing Dates
    const missingDates = [];
    let currentDate = new Date(startDate);

    // Normalize time to comparse dates accurately
    currentDate.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate).setHours(0, 0, 0, 0);

    // Create a Set of existing log dates for O(1) lookup
    const existingDates = new Set(
      logs.map(l => l.date.toISOString().split('T')[0])
    );

    while (currentDate.getTime() <= endDateTime) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (!existingDates.has(dateString)) {
        missingDates.push(dateString);
      }
      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (logs.length === 0) {
      // If absolutely no logs, just return a message (or let AI generate a "nothing done" summary if preferred)
      return res.status(200).json({ summary: `No logs found from ${startStr} to ${endStr}.` });
    }

    const logsText = logs
      .map((log) => `Date: ${log.date.toISOString().split("T")[0]}\nTasks: ${log.tasks.map((t) => t.content).join(", ")}`)
      .join("\n\n");

    // 2. Construct Prompt with Missing Dates Info
    let prompt = `Summarize the following work logs into a concise weekly report highlighting key achievements and progress:\n\n${logsText}\n\n`;

    if (missingDates.length > 0) {
      prompt += `IMPORTANT: The following dates had NO recorded activity: ${missingDates.join(", ")}. Please explicitly mention that no work was logged on these dates in the summary.\n\n`;
    }

    prompt += `Summary:`;

    // Updated model to one commonly supported by the free router
    const modelName = process.env.HF_MODEL_ID || "meta-llama/Meta-Llama-3-8B-Instruct";

    const completion = await ai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.7,
    });

    res.status(200).json({ summary: completion.choices[0].message.content });
  } catch (error) {
    console.error("AI Summary Error Full:", error);
    // Send more detailed error if available
    res.status(500).json({ message: error.message, details: error.response?.data });
  }
};

/**
 * Helper to generate tags from content using AI.
 */
const generateTags = async (content) => {
  try {
    const prompt = `Extract 1-3 relevant tags (e.g., #Frontend, #BugFix, #Meeting) for this work log. Return ONLY the tags separated by commas, no other text.\n\nLog: "${content}"\n\nTags:`;

    // Updated model to one commonly supported by the free router
    const modelName = process.env.HF_MODEL_ID || "meta-llama/Meta-Llama-3-8B-Instruct";

    const completion = await ai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content.trim();
    // Clean up tags: remove #, split by comma, trim whitespace
    return text.split(',').map(tag => tag.replace(/#/g, '').trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("AI Tagging Error:", error);
    return []; // Fail gracefully with no tags
  }
};

/**
 * Add or update a work log for a specific date.
 * If a log exists for the date, it adds the new task to it.
 * Otherwise, it creates a new log entry.
 */
export const addOrUpdateLog = async (req, res) => {
  try {
    const { date, content } = req.body;
    const userId = req.user.id;

    if (!date || !content || content.trim() === "") {
      return res.status(400).json({ message: "Date and content are required" });
    }

    // 2. Immediate Save (Prioritize UI responsiveness)
    // We let MongoDB generate the _id for the new task automatically.
    const log = await WorkLog.findOneAndUpdate(
      { userId, date: new Date(date) },
      { $push: { tasks: { content, tags: [], createdAt: new Date() } } },
      { upsert: true, new: true }
    );

    // 3. Send Response IMMEDIATELY
    res.status(200).json(log);

    // 4. Background Process: Generate Tags & Update
    // Identify the task we just added (it will be the last one in the list)
    if (log && log.tasks && log.tasks.length > 0) {
      const newTask = log.tasks[log.tasks.length - 1];
      const taskId = newTask._id;

      generateTags(content)
        .then(async (tags) => {
          if (tags && tags.length > 0) {
            try {
              await WorkLog.updateOne(
                { "tasks._id": taskId },
                { $set: { "tasks.$.tags": tags } }
              );
              console.log(`[Background] Tags added for task ${taskId}:`, tags);
            } catch (err) {
              console.error("[Background] Failed to update tags:", err);
            }
          }
        })
        .catch((err) => console.error("[Background] Tag generation failed:", err));
    }

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    } else {
      console.error("Error in addOrUpdateLog:", error);
    }
  }
};

/**
 * Retrieve all work logs for the authenticated user, sorted by latest date first.
 */
/**
 * Retrieve all work logs for the authenticated user, sorted by latest date first.
 * Supports pagination: ?page=1&limit=10
 * Supports date filtering: ?date=YYYY-MM-DD
 */
export const getAllLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, date } = req.query;

    const query = { userId };

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // specific pagination
    if (page && limit) {
      const pageInt = parseInt(page);
      const limitInt = parseInt(limit);
      const skip = (pageInt - 1) * limitInt;

      const logs = await WorkLog.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitInt);

      const totalDocs = await WorkLog.countDocuments(query);
      const totalPages = Math.ceil(totalDocs / limitInt);

      return res.status(200).json({
        logs,
        totalPages,
        currentPage: pageInt
      });
    }

    // Default: all logs (legacy support)
    const logs = await WorkLog.find(query).sort({ date: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single work log for a specific date.
 * URL Param: date (YYYY-MM-DD)
 */
export const getLogByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateParam = req.params.date;

    const start = new Date(dateParam);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateParam);
    end.setHours(23, 59, 59, 999);

    const log = await WorkLog.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    res.status(200).json(log || { tasks: [] }); // return tasks array
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get work logs within a specific date range.
 * Query Params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
export const getLogsByRange = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user.id;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "From and To dates are required" });
    }

    const logs = await WorkLog.find({
      userId,
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    }).sort({ date: 1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate and download an Excel file summary of work logs.
 * Can optionally filter by a date range.
 * Query Params (Optional): start (YYYY-MM-DD), end (YYYY-MM-DD)
 */
export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query; // optional query params

    let filter = { userId };

    if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    const logs = await WorkLog.find(filter).sort({ date: 1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Work Log Summary");

    // Add headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Tasks", key: "tasks", width: 50 },
    ];

    // Add data
    logs.forEach((log) => {
      worksheet.addRow({
        date: log.date.toISOString().split("T")[0],
        tasks: log.tasks.map((t) => t.content).join(", "),
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=worklog_summary.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update the content of a specific task within a work log.
 * URL Params: logId (Document ID), taskId (Sub-document ID)
 */
export const updateTask = async (req, res) => {
  try {
    const { logId, taskId } = req.params; // Document ID and Task ID
    const { content, tags } = req.body;

    const updateFields = {
      "tasks.$.content": content
    };
    if (tags !== undefined) updateFields["tasks.$.tags"] = tags;

    const log = await WorkLog.findOneAndUpdate(
      { _id: logId, "tasks._id": taskId },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a specific task from a work log.
 * URL Params: logId (Document ID), taskId (Sub-document ID)
 */
export const deleteTask = async (req, res) => {
  try {
    const { logId, taskId } = req.params;
    const userId = req.user.id;

    const log = await WorkLog.findOneAndUpdate(
      { _id: logId, userId },
      { $pull: { tasks: { _id: taskId } } },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ message: "Log or task not found" });
    }

    // Optional: If tasks array is empty, maybe delete the whole log?
    // For now, we keep the log entry even if empty, or you can choose to remove it.
    if (log.tasks.length === 0) {
      await WorkLog.findByIdAndDelete(logId);
      return res.status(200).json({ message: "Log entry deleted as it has no tasks", deletedLogId: logId });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get worklog stats for the heatmap (last 365 days).
 * Returns array of { date: "YYYY-MM-DD", count: number, level: number }
 */
export const getWorklogStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    const logs = await WorkLog.find({
      userId,
      date: { $gte: startOfYear, $lte: endOfYear },
    });

    const stats = logs.map((log) => {
      const count = log.tasks.length;
      // Defines level based on task count: 0 (0), 1 (1-2), 2 (3-4), 3 (5-6), 4 (7+)
      let level = 0;
      if (count <= 2 && count > 0) level = 1;
      else if (count <= 4 && count > 2) level = 2;
      else if (count <= 6 && count > 4) level = 3;
      else if (count > 6) level = 4;

      return {
        date: log.date.toISOString().split("T")[0],
        count,
        level,
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Search work logs by content.
 * Query Params: q (string)
 */
export const searchLogs = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const logs = await WorkLog.find({
      userId,
      $or: [
        { "tasks.content": { $regex: q, $options: "i" } },
        { "tasks.tags": { $regex: q, $options: "i" } }
      ]
    }).sort({ date: -1 });

    // Flatten results to show specific matching tasks
    const results = [];
    logs.forEach((log) => {
      log.tasks.forEach((task) => {
        // Match content OR tags
        const contentMatch = task.content.toLowerCase().includes(q.toLowerCase());
        const tagMatch = task.tags && task.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()));

        if (contentMatch || tagMatch) {
          results.push({
            _id: task._id,
            logId: log._id,
            date: log.date,
            content: task.content,
            tags: task.tags || [],
            createdAt: task.createdAt,
          });
        }
      });
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get standup update (yesterday's logs or last logged day) using AI.
 */
export const getStandup = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Try to find logs for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    let logs = await WorkLog.find({
      userId,
      date: { $gte: yesterdayStart, $lte: yesterdayEnd }
    });

    let descriptors = "Yesterday";
    let logDate = yesterday;

    // 2. If no logs yesterday, find the last logged day
    if (logs.length === 0) {
      const lastLog = await WorkLog.findOne({
        userId,
        date: { $lt: today }
      }).sort({ date: -1 });

      if (lastLog) {
        logs = [lastLog];
        logDate = lastLog.date;
        descriptors = `Last logged day (${logDate.toISOString().split('T')[0]})`;
      }
    }

    const tasks = logs.flatMap(log => log.tasks.map(t => t.content));
    const tasksList = tasks.map(t => `- ${t}`).join("\n");

    if (tasks.length === 0) {
      return res.status(200).json({ standup: "No logs found to generate a standup." });
    }

    // 3. Generate AI Standup
    const prompt = `Based on the following tasks completed on ${descriptors} (${logDate.toISOString().split('T')[0]}), generate a professional daily standup update.
    
    Tasks:
    ${tasksList}

    Format the output exactly like this:
    
    Yesterday:
    - [Brief summary of key tasks]

    Today:
    - [Breif summary if mentioned in the tasks else Leave blank for user to fill]

    Blockers:
    - [Breif summary if mentioned in the tasks else None]

    Keep it concise and professional. Do not add any conversational filler.`;

    const modelName = process.env.HF_MODEL_ID || "meta-llama/Meta-Llama-3-8B-Instruct";

    const completion = await ai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
      temperature: 0.7,
    });

    const standup = completion.choices[0].message.content.trim();

    res.status(200).json({
      date: logDate.toISOString().split('T')[0],
      descriptor: descriptors,
      standup
    });

  } catch (error) {
    console.error("Standup Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
};