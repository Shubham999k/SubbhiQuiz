import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const filter = req.query.filter || "weekly"; // daily, weekly, monthly, all
    const category = req.query.category || "all";
    let matchFilter = { userId: new mongoose.Types.ObjectId(req.user._id) };
    
    if (filter !== "all" && filter !== "all_time") {
      const date = new Date();
      if (filter === "daily") date.setDate(date.getDate() - 1);
      else if (filter === "weekly") date.setDate(date.getDate() - 7);
      else if (filter === "monthly") date.setMonth(date.getMonth() - 1);
      matchFilter.date = { $gte: date };
    }

    if (category !== "all") {
      matchFilter.category = category;
    }

    const leaderboard = await QuizResult.aggregate([
      { $match: matchFilter },
      { $unwind: "$participants" },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$participants.name" } } },
          originalName: { $first: { $trim: { input: "$participants.name" } } },
          quizzes: { $sum: 1 },
          average: {
            $avg: {
              $multiply: [
                {
                  $divide: [
                    "$participants.correctCount",
                    { $max: ["$totalQuestions", 1] }
                  ]
                },
                100
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: "$originalName",
          avatar: { $literal: null },
          quizzes: 1,
          average: { $round: ["$average", 1] },
        }
      },
      {
        $sort: { average: -1, quizzes: -1, name: 1 },
      },
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get categories that have been played (exist in results)
// @route   GET /api/leaderboard/categories
// @access  Private
export const getPlayedCategories = async (req, res) => {
  try {
    const categories = await QuizResult.distinct("category", { userId: new mongoose.Types.ObjectId(req.user._id) });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
