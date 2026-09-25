import QuizResult from "../models/QuizResult.js";

// @desc    Get user quiz history
// @route   GET /api/history
// @access  Private
export const getHistory = async (req, res) => {
  try {
    // Exclude questions[] and participants[] from the list response.
    // The dashboard and history page only need summary fields — returning
    // full question data was inflating the payload 10-50x unnecessarily.
    // .lean() returns plain JS objects (not Mongoose docs) — 2-3x faster
    // for read-only endpoints.
    const history = await QuizResult
      .find({ userId: req.user._id })
      .select("category difficulty score totalQuestions accuracy timeTaken date categoryId")
      .sort({ date: -1 })
      .lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Submit a new quiz result
// @route   POST /api/history
// @access  Private
export const submitResult = async (req, res) => {
  try {
    const { category, score, totalQuestions, accuracy, difficulty, timeTaken, questions, participants } = req.body;

    const result = await QuizResult.create({
      userId: req.user._id,
      category,
      score,
      totalQuestions,
      accuracy,
      difficulty,
      timeTaken,
      questions,
      participants,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single quiz history by ID
// @route   GET /api/history/:id
// @access  Private
export const getHistoryById = async (req, res) => {
  try {
    const history = await QuizResult.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!history) {
      return res.status(404).json({ message: "History not found" });
    }
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
