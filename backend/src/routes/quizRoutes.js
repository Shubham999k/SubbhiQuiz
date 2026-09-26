import express from "express";
import { protect, protectStudent } from "../middlewares/authMiddleware.js";
import { getCategories, getQuestions, saveCustomQuiz, getCustomQuizzes, deleteCustomQuiz, studentJoinQuiz, getStudentLeaderboard } from "../controllers/quizController.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/questions", getQuestions);

router.post("/student-join", studentJoinQuiz);
router.get("/student-leaderboard", protectStudent, getStudentLeaderboard);

router.route("/custom")
  .post(protect, saveCustomQuiz)
  .get(protect, getCustomQuizzes);

router.route("/custom/:id")
  .delete(protect, deleteCustomQuiz);

export default router;
