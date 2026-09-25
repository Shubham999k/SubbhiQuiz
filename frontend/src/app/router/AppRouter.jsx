import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../../components/common/AnimatedPage";
import Loader from "../../components/common/Loader";

// Eagerly loaded — critical path for first paint (unauthenticated visitors)
import PublicLayout from "../../components/layout/PublicLayout";
import Landing from "../../features/landing/components/Landing";
import Login from "../../features/auth/components/Login";
import Register from "../../features/auth/components/Register";
import StudentJoin from "../../features/students/components/StudentJoin";

// Lazily loaded — only downloaded when the user navigates to these routes.
// This breaks the 990 KB monolith into per-route chunks loaded on demand,
// reducing the initial JS parse cost significantly.
const DashboardLayout = lazy(() => import("../../components/layout/DashboardLayout"));
const ProtectedRoute = lazy(() => import("../../features/auth/components/ProtectedRoute"));
const Dashboard = lazy(() => import("../../features/dashboard/components/Dashboard"));
const Categories = lazy(() => import("../../features/questions/components/Categories"));
const QuizSetup = lazy(() => import("../../features/quiz/components/QuizSetup"));
const QuizActive = lazy(() => import("../../features/quiz/components/QuizActive"));
const QuizResult = lazy(() => import("../../features/quiz/components/QuizResult"));
const QuizReview = lazy(() => import("../../features/quiz/components/QuizReview"));
const History = lazy(() => import("../../features/analytics/components/History"));
const Analytics = lazy(() => import("../../features/analytics/components/Analytics"));
const Leaderboard = lazy(() => import("../../features/leaderboard/components/Leaderboard"));
const Profile = lazy(() => import("../../features/profile/components/Profile"));
const ClassroomTeacher = lazy(() => import("../../features/classroom/components/ClassroomTeacher"));
const ClassroomProjector = lazy(() => import("../../features/projector/components/ClassroomProjector"));
const StudentActive = lazy(() => import("../../features/students/components/StudentActive"));
const StudentSummary = lazy(() => import("../../features/students/components/StudentSummary"));



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
        {/* Public Routes — eagerly loaded, no Suspense needed */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        </Route>

        {/* Protected Dashboard Routes — lazily loaded */}
        <Route
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            </Suspense>
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
            <Suspense fallback={<Loader message="Loading..." />}>
              <ProtectedRoute>
                <AnimatedPage className="min-h-screen bg-base-200">
                  <QuizActive />
                </AnimatedPage>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/quiz/:quizId/result"
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <ProtectedRoute>
                <AnimatedPage className="min-h-screen bg-base-200">
                  <QuizResult />
                </AnimatedPage>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/quiz/:quizId/review"
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <ProtectedRoute>
                <AnimatedPage className="min-h-screen bg-base-200">
                  <QuizReview />
                </AnimatedPage>
              </ProtectedRoute>
            </Suspense>
          }
        />

        {/* Classroom Routes */}
        <Route
          path="/classroom/projector/:quizId"
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <ProtectedRoute>
                <AnimatedPage>
                  <ClassroomProjector />
                </AnimatedPage>
              </ProtectedRoute>
            </Suspense>
          }
        />

        {/* Student Classroom Routes (No Auth Required) */}
        <Route path="/student/join" element={<AnimatedPage><StudentJoin /></AnimatedPage>} />
        <Route
          path="/student/active"
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <AnimatedPage><StudentActive /></AnimatedPage>
            </Suspense>
          }
        />
        <Route
          path="/student/summary"
          element={
            <Suspense fallback={<Loader message="Loading..." />}>
              <AnimatedPage><StudentSummary /></AnimatedPage>
            </Suspense>
          }
        />

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
