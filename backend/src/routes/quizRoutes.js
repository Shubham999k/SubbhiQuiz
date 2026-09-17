import express from "express";
import { getCategories, getQuestions } from "../controllers/quizController.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/questions", getQuestions);

export default router;
