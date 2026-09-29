import ActivityLog from "../models/ActivityLog.js";
import CustomQuiz from "../models/CustomQuiz.js";
import QuizResult from "../models/QuizResult.js";

// @desc    Get activity logs
// @route   GET /api/activity
// @access  Private
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching activity logs", error: error.message });
  }
};

// @desc    Delete specific activity log
// @route   DELETE /api/activity/:id
// @access  Private
export const deleteActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }
    await log.deleteOne();
    res.json({ message: "Activity log removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting activity log", error: error.message });
  }
};

// @desc    Delete previous 30 days data
// @route   DELETE /api/activity/old
// @access  Private
export const deleteOldActivityLogs = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await ActivityLog.deleteMany({
      user: req.user._id,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    res.json({ message: "Old activity logs removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting old activity logs", error: error.message });
  }
};

// @desc    Delete previous 7 days data
// @route   DELETE /api/activity/old-week
// @access  Private
export const deleteWeekOldActivityLogs = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await ActivityLog.deleteMany({
      user: req.user._id,
      createdAt: { $lt: sevenDaysAgo }
    });
    
    res.json({ message: "Activity logs older than 7 days removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting old activity logs", error: error.message });
  }
};

// @desc    Clear all activity logs
// @route   DELETE /api/activity
// @access  Private
export const clearAllActivityLogs = async (req, res) => {
  try {
    await ActivityLog.deleteMany({ user: req.user._id });
    res.json({ message: "All activity logs removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error clearing activity logs", error: error.message });
  }
};

// @desc    Restore a deleted item
// @route   POST /api/activity/restore/:id
// @access  Private
export const restoreActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    
    if (!log) return res.status(404).json({ message: "Log not found" });
    if (log.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Not authorized" });
    if (!log.isRestorable) return res.status(400).json({ message: "This action cannot be restored" });
    if (log.isRestored) return res.status(400).json({ message: "Item is already restored" });

    const { collection, data } = log.restoreData;

    if (collection === "CustomQuiz") {
      // Create new quiz with same data (remove _id to let Mongo generate a new one to avoid conflicts, or keep it if we want exact same. Let's remove _id to be safe)
      const newData = { ...data };
      delete newData._id;
      await CustomQuiz.create(newData);
    } else if (collection === "QuizResult") {
      const newData = { ...data };
      delete newData._id;
      await QuizResult.create(newData);
    } else if (collection === "StudentFromResults") {
      // data is an array of { quizResultId, participant }
      for (const item of data) {
        if (item.quizResultId && item.participant) {
          await QuizResult.updateOne(
            { _id: item.quizResultId },
            { $push: { participants: item.participant } }
          );
        }
      }
    } else {
      return res.status(400).json({ message: "Unknown collection to restore" });
    }

    log.isRestored = true;
    log.details = `${log.details} (Restored)`;
    await log.save();

    res.json({ message: "Item restored successfully", log });
  } catch (error) {
    res.status(500).json({ message: "Server error restoring item", error: error.message });
  }
};
