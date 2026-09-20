import express from "express";
import { getLeaderboard, getPlayedCategories } from "../controllers/leaderboardController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/categories").get(protect, getPlayedCategories);
router.route("/").get(protect, getLeaderboard);

export default router;
