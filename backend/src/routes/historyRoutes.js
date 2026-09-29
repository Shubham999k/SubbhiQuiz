import express from "express";
import { getHistory, submitResult, getHistoryById, clearHistory, deleteHistoryItem } from "../controllers/historyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getHistory).post(protect, submitResult).delete(protect, clearHistory);
router.route("/:id").get(protect, getHistoryById).delete(protect, deleteHistoryItem);

export default router;
