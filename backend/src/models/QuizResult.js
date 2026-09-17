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

const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;
