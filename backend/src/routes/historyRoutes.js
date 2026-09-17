import express from "express";
import { getHistory, submitResult, getHistoryById } from "../controllers/historyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getHistory).post(protect, submitResult);
router.route("/:id").get(protect, getHistoryById);

export default router;
