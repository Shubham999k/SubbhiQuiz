import React, { useState } from "react";
import { api } from "../../services/api";
import { QuizContext } from "./QuizContext";

export const QuizProvider = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState(() => {
    try {
      const saved = localStorage.getItem("subbhi_currentQuiz");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem("subbhi_questions");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(() => {
    try {
      const saved = localStorage.getItem("subbhi_isQuizActive");
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });
  const [quizResult, setQuizResult] = useState(null);

  // Sync state to localStorage to survive refreshes
  React.useEffect(() => {
    if (currentQuiz) {
      localStorage.setItem("subbhi_currentQuiz", JSON.stringify(currentQuiz));
      localStorage.setItem("subbhi_questions", JSON.stringify(questions));
      localStorage.setItem("subbhi_isQuizActive", JSON.stringify(isQuizActive));
    } else {
      localStorage.removeItem("subbhi_currentQuiz");
      localStorage.removeItem("subbhi_questions");
      localStorage.removeItem("subbhi_isQuizActive");
    }
  }, [currentQuiz, questions, isQuizActive]);

  const setupQuiz = async (category, difficulty, count, timeLimitSeconds = null, timerType = "overall") => {
    const fetchedQuestions = await api.getQuestions(
      category,
      difficulty,
      count,
    );
    setQuestions(fetchedQuestions);

    const resolvedTimeLimit = timeLimitSeconds !== null ? timeLimitSeconds : fetchedQuestions.length * 60;

    setCurrentQuiz({
      category,
      difficulty,
      count: fetchedQuestions.length,
      timeLimit: resolvedTimeLimit,
      timerType: timerType,
    });

    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(resolvedTimeLimit);
    setQuizResult(null);
    setIsQuizActive(true);
  };

  const setupCustomQuiz = (customQuestions, timeLimitSeconds, timerType = "overall", title = "Custom Quiz") => {
    setQuestions(customQuestions);

    setCurrentQuiz({
      category: title,
      difficulty: "mixed",
      count: customQuestions.length,
      timeLimit: timeLimitSeconds,
      timerType: timerType,
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
      } else if (
        selected === q.correctAnswer ||
        selected === q.options[q.correctAnswer]
      ) {
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
