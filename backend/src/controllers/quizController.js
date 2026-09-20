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
    const { id, title, questions, timeLimit, timerType } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Title and questions are required" });
    }

    if (id) {
      const existingQuiz = await CustomQuiz.findOne({ _id: id, userId: req.user._id });
      if (!existingQuiz) {
        return res.status(404).json({ message: "Custom quiz not found or unauthorized" });
      }

      // Check if any OTHER quiz has this title (case-insensitive)
      const duplicateExists = await CustomQuiz.findOne({ 
        title: { $regex: new RegExp(`^${title.trim()}$`, "i") }, 
        userId: req.user._id,
        _id: { $ne: id }
      });
      
      if (duplicateExists) {
        return res.status(400).json({ message: "Another quiz with this title already exists. Please choose a unique title." });
      }
      
      existingQuiz.title = title;
      existingQuiz.questions = questions;
      if (timeLimit !== undefined) existingQuiz.timeLimit = timeLimit;
      if (timerType !== undefined) existingQuiz.timerType = timerType;
      const updatedQuiz = await existingQuiz.save();
      return res.status(200).json(updatedQuiz);
    }

    // Check for duplicate title on create (case-insensitive)
    const titleExists = await CustomQuiz.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") }, 
      userId: req.user._id 
    });
    if (titleExists) {
      return res.status(400).json({ message: "A quiz with this title already exists. Please choose a unique title." });
    }

    const result = await CustomQuiz.create({
      userId: req.user._id,
      title,
      questions,
      timeLimit,
      timerType,
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

// @desc    Delete a custom quiz
// @route   DELETE /api/quiz/custom/:id
// @access  Private
export const deleteCustomQuiz = async (req, res) => {
  try {
    const quiz = await CustomQuiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found or unauthorized" });
    }
    await quiz.deleteOne();
    res.json({ message: "Quiz removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
