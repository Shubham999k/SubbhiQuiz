import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    type: {
      type: String,
      enum: ["QUIZ_TAKEN", "QUIZ_ADDED", "QUIZ_DELETED", "STUDENT_ADDED", "STUDENT_DELETED", "CATEGORY_ADDED", "CATEGORY_DELETED", "OTHER", "HISTORY_DELETED"],
      default: "OTHER",
    },
    isRestorable: {
      type: Boolean,
      default: false,
    },
    restoreData: {
      type: mongoose.Schema.Types.Mixed, // Stores the backup object for restoration
    },
    isRestored: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
