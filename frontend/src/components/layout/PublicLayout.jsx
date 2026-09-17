import React from "react";
import { Outlet, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 shadow-md border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                QuizPro
              </span>
            </Link>
            <nav className="flex space-x-4 items-center">
              <Link
                to="/login"
                className="text-indigo-50 hover:text-white font-medium px-3 py-2 rounded-md transition-colors hover:bg-white/10"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-medium px-5 py-2 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
              >
                Sign up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} QuizPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
