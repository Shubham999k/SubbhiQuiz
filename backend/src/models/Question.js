import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    options: [
      {
        type: String,
        required: true,
      },
    ],
    correctAnswer: {
      type: Number, // index of the correct option
      required: true,
    },
    category: {
      type: String, // referring to Category id
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true },
);

// Compound index covering the getQuestions query pattern:
//   Question.find({ category, difficulty })
// Without this, filtering questions requires a full collection scan.
questionSchema.index({ category: 1, difficulty: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;

