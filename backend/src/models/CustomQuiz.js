import mongoose from "mongoose";

const customQuizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
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
    timeLimit: {
      type: Number,
      default: 10,
    },
    timerType: {
      type: String,
      enum: ["overall", "per_question"],
      default: "overall",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CustomQuiz = mongoose.model("CustomQuiz", customQuizSchema);
export default CustomQuiz;
