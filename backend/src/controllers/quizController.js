import Category from "../models/Category.js";
import Question from "../models/Question.js";

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
