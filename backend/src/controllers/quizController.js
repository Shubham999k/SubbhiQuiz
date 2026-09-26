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
    const { id, title, description, icon, questions, timeLimit, timerType } = req.body;
    
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
      if (description !== undefined) existingQuiz.description = description;
      if (icon !== undefined) existingQuiz.icon = icon;
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
      description: description || "Custom quiz created by you.",
      icon: icon || "Save",
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

import jwt from "jsonwebtoken";
import { getActiveSession } from "../socket/index.js";

// @desc    Student join session to get token
// @route   POST /api/quiz/student-join
// @access  Public
export const studentJoinQuiz = async (req, res) => {
  try {
    const { sessionCode, name, roll, batch } = req.body;
    if (!sessionCode || !name || !roll) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // We can optionally verify that the session is active
    // const session = getActiveSession(sessionCode);
    // if (!session) return res.status(404).json({ message: "Session not active" });

    // Generate JWT for the student
    const token = jwt.sign({ roll, name, sessionCode, role: "student" }, process.env.JWT_SECRET || "secret", { expiresIn: "12h" });
    
    res.json({ token, studentInfo: { name, roll, batch, sessionCode } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session leaderboard for students
// @route   GET /api/quiz/student-leaderboard
// @access  Private (Student)
export const getStudentLeaderboard = async (req, res) => {
  try {
    const { sessionCode, roll } = req.student;
    
    // Verify query param matches token to prevent probing, though we rely on token anyway
    if (req.query.sessionCode && req.query.sessionCode !== sessionCode) {
      return res.status(403).json({ message: "Unauthorized session access" });
    }

    const session = getActiveSession(sessionCode);
    if (!session) {
      return res.status(404).json({ message: "Quiz session not found or already ended." });
    }

    if (!session.resultsReleased) {
      return res.status(403).json({ message: "Leaderboard not released yet." });
    }

    const personalResult = session.students[roll];
    if (!personalResult) {
      // If student is not in the session leaderboard, they shouldn't see it
      return res.status(403).json({ message: "You did not participate in this session." });
    }

    res.json({
      success: true,
      result: {
        ...personalResult,
        totalQuestions: session.totalQuestions,
      },
      leaderboard: session.leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
