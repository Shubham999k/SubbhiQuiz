import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import ThemeSelector from "../common/ThemeSelector";

const PublicLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "How It Works", path: "/#how-it-works" },
    { name: "About", path: "/#about" },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212]">
      <header className="bg-white dark:bg-[#121212] sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group shrink-0">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Quizzz-Zone
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeSelector />
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:border-base-content px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              <ThemeSelector />
              <button
                type="button"
                className="p-2 -mr-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:bg-[#1e1e1e] rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] absolute w-full left-0 shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block px-3 py-3 rounded-md text-base font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:bg-[#1e1e1e] hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-3 px-3">
                <Link
                  to="/login"
                  className="w-full text-center text-base font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 py-2.5 rounded-lg hover:bg-gray-100 dark:bg-[#1e1e1e] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center bg-primary text-white text-base font-semibold py-2.5 rounded-lg hover:opacity-90 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left text-gray-600 dark:text-gray-400 text-sm font-medium">
            Same Experience. On Every Screen.
          </div>
          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-500 text-sm">
            <span className="font-semibold text-gray-600 dark:text-gray-400">Quizzz-Zone</span>
            <span>|</span>
            <span>Learn</span>
            <span>•</span>
            <span>Practice</span>
            <span>•</span>
            <span>Grow</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
