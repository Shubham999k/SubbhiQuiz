import express from "express";
import { getHistory, submitResult } from "../controllers/historyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getHistory).post(protect, submitResult);

export default router;
