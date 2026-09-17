import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
    <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
    <a
      href="/"
      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
    >
      Go Home
    </a>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/quiz/setup" element={<QuizSetup />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected Quiz Routes (No Sidebar, Full Screen) */}
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <QuizActive />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId/result"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <QuizResult />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId/review"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <QuizReview />
              </div>
            </ProtectedRoute>
          }
        />

        {/* Classroom Routes */}
        <Route
          path="/classroom/teacher/:quizId"
          element={
            <ProtectedRoute>
              <ClassroomTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classroom/projector/:quizId"
          element={
            <ProtectedRoute>
              <ClassroomProjector />
            </ProtectedRoute>
          }
        />

        {/* Student Classroom Routes (No Auth Required) */}
        <Route path="/student/join" element={<StudentJoin />} />
        <Route path="/student/active" element={<StudentActive />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
