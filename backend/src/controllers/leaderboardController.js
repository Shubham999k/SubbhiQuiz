import QuizResult from "../models/QuizResult.js";

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const filter = req.query.filter || "weekly"; // daily, weekly, monthly, all

    let dateFilter = {};
    if (filter !== "all") {
      const date = new Date();
      if (filter === "daily") date.setDate(date.getDate() - 1);
      else if (filter === "weekly") date.setDate(date.getDate() - 7);
      else if (filter === "monthly") date.setMonth(date.getMonth() - 1);
      dateFilter = { date: { $gte: date } };
    }

    const leaderboard = await QuizResult.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$userId",
          quizzes: { $sum: 1 },
          average: { $avg: "$accuracy" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          name: "$user.name",
          quizzes: 1,
          average: { $round: ["$average", 1] },
        },
      },
      {
        $sort: { average: -1, quizzes: -1 },
      },
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
