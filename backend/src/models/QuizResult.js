import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
    },
    timeSpent: {
      type: Number, // in seconds
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;
