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
    const start = req.query.start || req.body.start;
    const end = req.query.end || req.body.end;
    const userId = req.user.id;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const logs = await WorkLog.find({
      userId,
      date: { $gte: new Date(start), $lte: new Date(end) },
    }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.status(200).json({ summary: "No logs found for the selected date range." });
    }

    const logsText = logs
      .map((log) => `Date: ${log.date.toISOString().split("T")[0]}\nTasks: ${log.tasks.map((t) => t.content).join(", ")}`)
      .join("\n\n");

    const prompt = `Summarize the following work logs into a concise weekly report highlighting key achievements and progress:\n\n${logsText}\n\nSummary:`;

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

    const log = await WorkLog.findOneAndUpdate(
      { userId, date: new Date(date) },
      { $push: { tasks: { content } } },
      { upsert: true, new: true }
    );

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieve all work logs for the authenticated user, sorted by latest date first.
 */
export const getAllLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const logs = await WorkLog.find({ userId }).sort({ date: -1 });
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
    const { content } = req.body;

    const log = await WorkLog.findOneAndUpdate(
      { _id: logId, "tasks._id": taskId },
      { $set: { "tasks.$.content": content } }, // Updates specific task in array
      { new: true }
    );

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};