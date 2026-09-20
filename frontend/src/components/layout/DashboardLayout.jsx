import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  List,
  History,
  BarChart3,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthContext";
import ThemeSelector from "../common/ThemeSelector";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Categories", href: "/categories", icon: List },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Profile", href: "/profile", icon: User },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    setIsLogoutModalOpen(false);
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-base-200 flex transition-colors duration-200 text-base-content">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-base-100 border-r border-base-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-base-300">
            <Link to="/dashboard" className="flex items-center justify-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-base-content">Quizzz-Zone</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-3 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  location.pathname.startsWith(item.href) ||
                  (item.name === "Categories" &&
                    location.pathname.startsWith("/quiz"));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-base-content hover:bg-base-200"
                    }`}
                  >
                    <item.icon
                      className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${isActive ? "text-primary" : "text-base-content/70"}`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-base-300">
            <div className="flex items-center px-3 py-2 rounded-lg hover:bg-base-200 transition-colors mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0) || "S"}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-base-content truncate">
                  {user?.name || "Student"}
                </p>
                <p className="text-xs text-base-content/70 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-error rounded-lg hover:bg-base-200 transition-colors"
            >
              <LogOut className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-error" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navbar */}
        <header className="bg-base-100 shadow-sm border-b border-base-300 h-16 flex items-center px-4 sm:px-6 justify-between">
          <div className="flex items-center md:hidden">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 group mr-4"
            >
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200 transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden md:flex items-center">
            <h2 className="text-lg font-bold text-base-content">
              Welcome back, {user?.name || "Student"} !
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-base-content">Theme:</span>
              <ThemeSelector className="w-40 md:w-48 z-50" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-base-200">
          <div className="py-4 px-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-base-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-base-content mb-2">Ready to Leave?</h3>
              <p className="text-base-content/70 mb-6">
                Are you sure you want to sign out of your account? You will need to log back in to access your quizzes.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-4 py-2 flex-1 border border-base-300 rounded-lg text-base-content hover:bg-base-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 flex-1 bg-error text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
