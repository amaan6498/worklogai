import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    tasks: [
      {
        content: { type: String, required: true },
        tags: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],

    logType: {
      type: String,
      enum: ["work", "sick_leave", "earned_leave", "casual_leave"],
      default: "work",
    },
  },
  { timestamps: true }
);

// Prevent duplicate entry for same day
workLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("WorkLog", workLogSchema);