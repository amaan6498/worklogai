import WorkLog from "../models/Worklog.js";
import ExcelJS from "exceljs";
import OpenAI from "openai";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const ai = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_ACCESS_TOKEN,
});

/**
 * Generate an AI-powered summary of work logs for a given date range.
 */
export const getAiSummary = catchAsync(async (req, res) => {
  const startStr = req.query.start || req.body.start;
  const endStr = req.query.end || req.body.end;
  const userId = req.user.id; // middleware ensures this exists

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  const logs = await WorkLog.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  // 1. Identify Missing Dates
  const missingDates = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const endDateTime = new Date(endDate).setHours(0, 0, 0, 0);

  const existingDates = new Set(
    logs.map(l => l.date.toISOString().split('T')[0])
  );

  while (currentDate.getTime() <= endDateTime) {
    const dateString = currentDate.toISOString().split('T')[0];
    if (!existingDates.has(dateString)) {
      missingDates.push(dateString);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (logs.length === 0) {
    return res.status(200).json({ summary: `No logs found from ${startStr} to ${endStr}.` });
  }

  const logsText = logs
    .map((log) => `Date: ${log.date.toISOString().split("T")[0]}\nTasks: ${log.tasks.map((t) => t.content).join(", ")}`)
    .join("\n\n");

  let prompt = `Summarize the following work logs into a concise weekly report highlighting key achievements and progress:\n\n${logsText}\n\n`;

  if (missingDates.length > 0) {
    prompt += `IMPORTANT: The following dates had NO recorded activity: ${missingDates.join(", ")}. Please explicitly mention that no work was logged on these dates in the summary.\n\n`;
  }

  prompt += `Summary:`;

  const modelName = process.env.HF_MODEL_ID || "meta-llama/Meta-Llama-3-8B-Instruct";

  const completion = await ai.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 512,
    temperature: 0.7,
  });

  res.status(200).json({ summary: completion.choices[0].message.content });
});

/**
 * Helper to generate tags from content using AI.
 */
const generateTags = async (content) => {
  try {
    const prompt = `Extract 1-3 relevant tags (e.g., #Frontend, #BugFix, #Meeting) for this work log. Return ONLY the tags separated by commas, no other text.\n\nLog: "${content}"\n\nTags:`;

    const modelName = process.env.HF_MODEL_ID || "meta-llama/Meta-Llama-3-8B-Instruct";

    const completion = await ai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content.trim();
    return text.split(',').map(tag => tag.replace(/#/g, '').trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("AI Tagging Error:", error);
    return [];
  }
};

/**
 * Add or update a work log for a specific date.
 */
export const addOrUpdateLog = catchAsync(async (req, res) => {
  const { date, content } = req.body;
  const userId = req.user.id;

  // Validation is handled by middleware but double check if needed or rely on schema

  const log = await WorkLog.findOneAndUpdate(
    { userId, date: new Date(date) },
    { $push: { tasks: { content, tags: [], createdAt: new Date() } } },
    { upsert: true, new: true }
  );

  res.status(200).json(log);

  // Background Process: Generate Tags & Update
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
});

/**
 * Retrieve all work logs for the authenticated user.
 */
export const getAllLogs = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, date } = req.query;

  const query = { userId };

  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

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

  const logs = await WorkLog.find(query).sort({ date: -1 });
  res.status(200).json(logs);
});

/**
 * Get a single work log for a specific date.
 */
export const getLogByDate = catchAsync(async (req, res) => {
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

  res.status(200).json(log || { tasks: [] });
});

/**
 * Get work logs within a specific date range.
 */
export const getLogsByRange = catchAsync(async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user.id;

  const logs = await WorkLog.find({
    userId,
    date: {
      $gte: new Date(from),
      $lte: new Date(to),
    },
  }).sort({ date: 1 });

  res.status(200).json(logs);
});

/**
 * Generate and download an Excel file summary.
 */
export const getSummary = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { start, end } = req.query;

  let filter = { userId };

  if (start && end) {
    filter.date = { $gte: new Date(start), $lte: new Date(end) };
  }

  const logs = await WorkLog.find(filter).sort({ date: 1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Work Log Summary");

  worksheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Tasks", key: "tasks", width: 50 },
  ];

  logs.forEach((log) => {
    worksheet.addRow({
      date: log.date.toISOString().split("T")[0],
      tasks: log.tasks.map((t) => t.content).join(", "),
    });
  });

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
});

/**
 * Update the content of a specific task.
 */
export const updateTask = catchAsync(async (req, res, next) => {
  const { logId, taskId } = req.params;
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

  if (!log) {
    return next(new AppError('No log found with that ID', 404));
  }

  res.status(200).json(log);
});

/**
 * Delete a specific task.
 */
export const deleteTask = catchAsync(async (req, res, next) => {
  const { logId, taskId } = req.params;
  const userId = req.user.id;

  const log = await WorkLog.findOneAndUpdate(
    { _id: logId, userId },
    { $pull: { tasks: { _id: taskId } } },
    { new: true }
  );

  if (!log) {
    return next(new AppError('Log or task not found', 404));
  }

  if (log.tasks.length === 0) {
    await WorkLog.findByIdAndDelete(logId);
    return res.status(200).json({ message: "Log entry deleted as it has no tasks", deletedLogId: logId });
  }

  res.status(200).json(log);
});

/**
 * Get worklog stats.
 */
export const getWorklogStats = catchAsync(async (req, res) => {
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
});

/**
 * Search work logs.
 */
export const searchLogs = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  const userId = req.user.id;

  // Validation handled by middleware usually, but keeping this simple check
  if (!q || q.trim() === "") {
    return next(new AppError("Search query is required", 400));
  }

  const logs = await WorkLog.find({
    userId,
    $or: [
      { "tasks.content": { $regex: q, $options: "i" } },
      { "tasks.tags": { $regex: q, $options: "i" } }
    ]
  }).sort({ date: -1 });

  const results = [];
  logs.forEach((log) => {
    log.tasks.forEach((task) => {
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
});

/**
 * Get standup update.
 */
export const getStandup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
});