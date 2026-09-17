import React, { useState } from "react";
import { api } from "../../services/api";
import { QuizContext } from "./QuizContext";

export const QuizProvider = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const setupQuiz = async (category, difficulty, count) => {
    const fetchedQuestions = await api.getQuestions(
      category,
      difficulty,
      count,
    );
    setQuestions(fetchedQuestions);

    const timeLimitSeconds = fetchedQuestions.length * 60; // 1 minute per question

    setCurrentQuiz({
      category,
      difficulty,
      count: fetchedQuestions.length,
      timeLimit: timeLimitSeconds,
    });

    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(timeLimitSeconds);
    setQuizResult(null);
    setIsQuizActive(true);
  };

  const setupCustomQuiz = (customQuestions, timeLimitSeconds) => {
    setQuestions(customQuestions);

    setCurrentQuiz({
      category: "custom",
      difficulty: "mixed",
      count: customQuestions.length,
      timeLimit: timeLimitSeconds,
      isCustom: true,
    });

    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(timeLimitSeconds);
    setQuizResult(null);
    setIsQuizActive(true);
  };

  const submitQuiz = async () => {
    setIsQuizActive(false);

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (!selected) {
        unanswered++;
      } else if (selected === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const accuracy =
      questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const timeTaken = currentQuiz.timeLimit - timeRemaining;

    const result = {
      quizId: currentQuiz.category,
      category: currentQuiz.category,
      difficulty: currentQuiz.difficulty,
      score: correct, // Each correct answer is 1 point
      totalQuestions: questions.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unanswered,
      accuracy,
      timeTaken,
      answers: { ...answers },
      questions: [...questions],
    };

    const savedResult = await api.submitQuizResult(result);
    setQuizResult(savedResult);
    return savedResult;
  };

  const setAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const jumpToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(0);
    setIsQuizActive(false);
    setQuizResult(null);
  };

  const value = {
    currentQuiz,
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    setTimeRemaining,
    isQuizActive,
    quizResult,
    setupQuiz,
    setupCustomQuiz,
    submitQuiz,
    setAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    resetQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
