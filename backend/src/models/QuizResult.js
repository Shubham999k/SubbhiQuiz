import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
    },
    timeTaken: {
      type: Number, // in seconds
    },
    date: {
      type: Date,
      default: Date.now,
    },
    questions: [
      {
        id: String,
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
      }
    ],
    participants: [
      {
        name: String,
        roll: String,
        score: Number,
        rank: Number,
        correctCount: Number,
        answers: {
          type: Map,
          of: String
        }
      }
    ]
  },
  { timestamps: true },
);

// Compound index covering the most common query pattern:
//   QuizResult.find({ userId }).sort({ date: -1 })
// Without this, MongoDB does a full collection scan on every history request.
// The compound index serves both the equality filter AND the sort in one pass.
quizResultSchema.index({ userId: 1, date: -1 });

const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;

