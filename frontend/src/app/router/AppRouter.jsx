import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../../components/common/AnimatedPage";

import PublicLayout from "../../components/layout/PublicLayout";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProtectedRoute from "../../features/auth/components/ProtectedRoute";

// Features
import Landing from "../../features/landing/components/Landing";
import Login from "../../features/auth/components/Login";
import Register from "../../features/auth/components/Register";
import Dashboard from "../../features/dashboard/components/Dashboard";
import Categories from "../../features/questions/components/Categories";
import QuizSetup from "../../features/quiz/components/QuizSetup";
import QuizActive from "../../features/quiz/components/QuizActive";
import QuizResult from "../../features/quiz/components/QuizResult";
import QuizReview from "../../features/quiz/components/QuizReview";
import History from "../../features/analytics/components/History";
import Analytics from "../../features/analytics/components/Analytics";
import Leaderboard from "../../features/leaderboard/components/Leaderboard";
import Profile from "../../features/profile/components/Profile";
import ClassroomTeacher from "../../features/classroom/components/ClassroomTeacher";
import ClassroomProjector from "../../features/projector/components/ClassroomProjector";
import StudentJoin from "../../features/students/components/StudentJoin";
import StudentActive from "../../features/students/components/StudentActive";
import StudentSummary from "../../features/students/components/StudentSummary";

const NotFound = () => (
  <AnimatedPage>
    <div className="min-h-screen flex items-center justify-center bg-base-200 flex-col">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-base-content/70 mb-8">Page Not Found</p>
      <a
        href="/"
        className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-80"
      >
        Go Home
      </a>
    </div>
  </AnimatedPage>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
          <Route path="/categories" element={<AnimatedPage><Categories /></AnimatedPage>} />
          <Route path="/quiz/setup" element={<AnimatedPage><QuizSetup /></AnimatedPage>} />
          <Route path="/history" element={<AnimatedPage><History /></AnimatedPage>} />
          <Route path="/analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
          <Route path="/leaderboard" element={<AnimatedPage><Leaderboard /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><Profile /></AnimatedPage>} />
          <Route path="/classroom/teacher/:quizId" element={<AnimatedPage><ClassroomTeacher /></AnimatedPage>} />
        </Route>

        {/* Protected Quiz Routes (No Sidebar, Full Screen) */}
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <AnimatedPage className="min-h-screen bg-base-200">
                <QuizActive />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId/result"
          element={
            <ProtectedRoute>
              <AnimatedPage className="min-h-screen bg-base-200">
                <QuizResult />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId/review"
          element={
            <ProtectedRoute>
              <AnimatedPage className="min-h-screen bg-base-200">
                <QuizReview />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />

        {/* Classroom Routes */}
        <Route
          path="/classroom/projector/:quizId"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <ClassroomProjector />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />

        {/* Student Classroom Routes (No Auth Required) */}
        <Route path="/student/join" element={<AnimatedPage><StudentJoin /></AnimatedPage>} />
        <Route path="/student/active" element={<AnimatedPage><StudentActive /></AnimatedPage>} />
        <Route path="/student/summary" element={<AnimatedPage><StudentSummary /></AnimatedPage>} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
