import QuizResult from "../models/QuizResult.js";

// @desc    Get user quiz history
// @route   GET /api/history
// @access  Private
export const getHistory = async (req, res) => {
  try {
    const history = await QuizResult.find({ userId: req.user._id }).sort({
      date: -1,
    });
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
    const { categoryId, score, total, difficulty, timeSpent } = req.body;

    const result = await QuizResult.create({
      userId: req.user._id,
      categoryId,
      score,
      total,
      difficulty,
      timeSpent,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
