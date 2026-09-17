import express from "express";
import { getCategories, getQuestions, saveCustomQuiz, getCustomQuizzes } from "../controllers/quizController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/questions", getQuestions);

router.route("/custom")
  .post(protect, saveCustomQuiz)
  .get(protect, getCustomQuizzes);

export default router;
