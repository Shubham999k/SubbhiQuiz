import express from "express";
import { getLeaderboard, getPlayedCategories, deleteStudentFromLeaderboard } from "../controllers/leaderboardController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/categories").get(protect, getPlayedCategories);
router.route("/student/:studentName").delete(protect, deleteStudentFromLeaderboard);
router.route("/").get(protect, getLeaderboard);

export default router;
