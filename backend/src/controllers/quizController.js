import Category from "../models/Category.js";
import Question from "../models/Question.js";
import CustomQuiz from "../models/CustomQuiz.js";

// @desc    Get all categories
// @route   GET /api/quiz/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get questions
// @route   GET /api/quiz/questions
// @access  Public
export const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;

    let query = {};
    if (category) {
      query.category = category;
    }
    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    // Fetch questions matching criteria
    const questions = await Question.find(query);

    // Shuffle and limit
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(limit));

    res.json(selected);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a custom quiz
// @route   POST /api/quiz/custom
// @access  Private
export const saveCustomQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Title and questions are required" });
    }

    const result = await CustomQuiz.create({
      userId: req.user._id,
      title,
      questions,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Save custom quiz error:", error);
    res.status(500).json({ message: error.message || error.toString() });
  }
};

// @desc    Get user's custom quizzes
// @route   GET /api/quiz/custom
// @access  Private
export const getCustomQuizzes = async (req, res) => {
  try {
    const quizzes = await CustomQuiz.find({ userId: req.user._id }).sort({
      date: -1,
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
