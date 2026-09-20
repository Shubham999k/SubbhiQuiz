import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import ThemeSelector from "../common/ThemeSelector";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <header className="bg-primary shadow-md border-b sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-base-100/20 p-1.5 rounded-lg backdrop-blur-sm group-hover:bg-base-100/30 transition-all">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                Quizzz-Zone
              </span>
            </Link>
            <nav className="flex space-x-4 items-center">
              <Link
                to="/login"
                className="text-primary-content/80 hover:text-white font-medium px-3 py-2 rounded-md transition-colors hover:bg-base-100/10 cursor-pointer"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-base-100 text-primary hover:bg-base-200 font-medium px-5 py-2 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                Sign up
              </Link>
              <ThemeSelector />
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-base-100 border-t border-base-300 mt-auto py-2 sticky bottom-0">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center text-base-content/70 text-sm">
          &copy; {new Date().getFullYear()} Quizzz-Zone. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
