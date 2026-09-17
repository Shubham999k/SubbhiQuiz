import { createContext, useContext } from "react";

export const QuizContext = createContext();

export const useQuiz = () => {
  return useContext(QuizContext);
};
