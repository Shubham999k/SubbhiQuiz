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
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthContext";

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
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-bg-base flex transition-colors duration-200 text-text-base">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-surface border-r border-border-subtle transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-border-subtle">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-text-base">QuizPro</span>
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
                        ? "bg-primary-100 text-primary-800"
                        : "text-text-base hover:bg-bg-base"
                    }`}
                  >
                    <item.icon
                      className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${isActive ? "text-primary-600" : "text-text-muted"}`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-border-subtle">
            <div className="flex items-center px-3 py-2 rounded-lg hover:bg-bg-base transition-colors mb-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {user?.name?.charAt(0) || "S"}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-text-base truncate">
                  {user?.name || "Student"}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navbar */}
        <header className="bg-bg-surface shadow-sm border-b border-border-subtle h-16 flex items-center px-4 sm:px-6 justify-between">
          <div className="flex items-center md:hidden">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 group mr-4"
            >
              <div className="bg-primary-100 p-1.5 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-text-muted hover:text-text-base hover:bg-bg-base transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden md:block">
            {/* Empty space on desktop for alignment */}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-text-base">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-border-subtle bg-bg-surface text-text-base focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="ocean">Ocean</option>
                <option value="forest">Forest</option>
                <option value="rose">Rose</option>
                <option value="sunset">Sunset</option>
                <option value="cyberpunk">Cyberpunk</option>
              </select>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-bg-base">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
