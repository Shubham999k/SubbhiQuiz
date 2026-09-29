import express from "express";
import { getActivityLogs, deleteActivityLog, deleteOldActivityLogs, deleteWeekOldActivityLogs, clearAllActivityLogs, restoreActivityLog } from "../controllers/activityController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getActivityLogs);
router.delete("/old", protect, deleteOldActivityLogs);
router.delete("/old-week", protect, deleteWeekOldActivityLogs);
router.delete("/:id", protect, deleteActivityLog);
router.delete("/", protect, clearAllActivityLogs);
router.post("/restore/:id", protect, restoreActivityLog);

export default router;
