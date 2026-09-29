import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async (userId, action, type = "OTHER", details = "", restoreData = null) => {
  try {
    if (!userId) return;
    const isRestorable = restoreData ? true : false;
    await ActivityLog.create({
      user: userId,
      action,
      type,
      details,
      isRestorable,
      restoreData,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
