import React, { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bell,
  Play
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthContext";
import ThemeSelector from "../common/ThemeSelector";
import Loader from "../common/Loader";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(next));
      return next;
    });
  };
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

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    const handleScroll = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true for capture phase to catch all scrolls
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);
  const [activeSession, setActiveSession] = useState(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem("active_teacher_session");
      setActiveSession(data ? JSON.parse(data) : null);
    } catch (e) {
      setActiveSession(null);
    }
  }, [location.pathname]);

  const isInsideClassroom = location.pathname.includes("/classroom");
  const showActiveSessionNotification = activeSession && !isInsideClassroom;

  const handleEndSession = () => {
    localStorage.removeItem("active_teacher_session");
    setActiveSession(null);
    setShowEndSessionConfirm(false);
    setShowNotifications(false);
  };

  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';
    
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let name = path.charAt(0).toUpperCase() + path.slice(1);
      
      if (path === 'dashboard') name = 'Dashboard';
      else if (path === 'categories') name = 'Categories';
      else if (path === 'quiz') name = 'Categories';
      else if (path === 'setup') name = 'Create';
      else if (path === 'history') name = 'History';
      else if (path === 'analytics') name = 'Analytics';
      else if (path === 'leaderboard') name = 'Leaderboard';
      else if (path === 'profile') name = 'Profile';
      else if (path === 'classroom') name = 'Classroom';
      else if (path === 'teacher') name = 'Teacher Mode';
      
      if (path.length === 24 && /^[0-9a-fA-F]{24}$/.test(path)) {
        name = 'Details';
      }

      const redirectPaths = ['classroom', 'teacher', 'projector'];
      let finalHref = currentPath;
      if (redirectPaths.includes(path)) {
        finalHref = '/dashboard';
      } else if (path === 'quiz') {
        finalHref = '/categories';
      }
      
      breadcrumbs.push({ name, href: finalHref });
    });

    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      if (tab === 'saved-quizzes') breadcrumbs.push({ name: 'Saved Quizzes', href: '/categories?tab=saved-quizzes' });
      if (tab === 'overview') breadcrumbs.push({ name: 'Overview', href: '/dashboard?tab=overview' });
    }

    if (breadcrumbs.length === 0) breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="h-screen overflow-hidden bg-base-200 flex transition-colors duration-200 text-base-content">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-base-content/20 dark:bg-black/40 backdrop-blur-sm md:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-base-100 border-r border-base-300 transform transition-all duration-300 ease-in-out md:translate-x-0 md:relative md:flex-shrink-0 ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"} ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-5 border-b border-base-300 w-64 overflow-hidden">
            <Link to="/dashboard" className="flex items-center space-x-3 w-full">
              <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              <span className={`text-xl font-bold text-base-content whitespace-nowrap transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'opacity-100 max-w-[200px] md:opacity-0 md:max-w-0' : 'opacity-100 max-w-[200px]'}`}>Quizzz-Zone</span>
            </Link>
          </div>

          <div className="flex-1 py-4">
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
                    className={`group relative flex items-center ${sidebarCollapsed ? 'w-full md:w-12' : 'w-full'} px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
                      isActive
                        ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                        : "text-base-content hover:bg-base-200"
                    }`}
                  >
                    <item.icon
                      className={`flex-shrink-0 h-6 w-6 ${isActive ? "text-primary-content" : "text-base-content/70"} transition-all duration-300`}
                    />
                    <span className={`truncate whitespace-nowrap transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'opacity-100 max-w-[200px] ml-3 md:opacity-0 md:max-w-0 md:ml-0' : 'opacity-100 max-w-[200px] ml-3'}`}>{item.name}</span>
                    
                    {sidebarCollapsed && (
                      <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-base-100 text-base-content text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl border-2 border-primary">
                        <div className="absolute top-1/2 -translate-y-1/2 -left-[6px] w-2.5 h-2.5 bg-base-100 border-l-2 border-b-2 border-primary rotate-45"></div>
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-base-300 flex flex-col gap-2 w-full">
            <button
              onClick={toggleSidebarCollapse}
              className={`group relative hidden md:flex items-center ${sidebarCollapsed ? 'w-12' : 'w-full'} px-3 py-3 text-sm font-medium text-base-content rounded-lg hover:bg-base-200 transition-all duration-300 ease-in-out`}
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="flex-shrink-0 h-6 w-6 text-base-content/70 transition-all duration-300" />
              ) : (
                <ChevronsLeft className="flex-shrink-0 h-6 w-6 text-base-content/70 transition-all duration-300" />
              )}
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'}`}>Collapse</span>
              
              {sidebarCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-base-100 text-base-content text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl border-2 border-primary">
                  <div className="absolute top-1/2 -translate-y-1/2 -left-[6px] w-2.5 h-2.5 bg-base-100 border-l-2 border-b-2 border-primary rotate-45"></div>
                  Expand
                </div>
              )}
            </button>

            <button
              onClick={handleLogoutClick}
              className={`group relative w-full flex items-center ${sidebarCollapsed ? 'w-full md:w-12' : 'w-full'} px-3 py-3 text-sm font-medium text-error rounded-lg hover:bg-base-200 transition-all duration-300 ease-in-out`}
            >
              <LogOut className="flex-shrink-0 h-6 w-6 text-error transition-all duration-300" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'opacity-100 max-w-[200px] ml-3 md:opacity-0 md:max-w-0 md:ml-0' : 'opacity-100 max-w-[200px] ml-3'}`}>Sign out</span>
              
              {sidebarCollapsed && (
                <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-base-100 text-base-content text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl border-2 border-error">
                  <div className="absolute top-1/2 -translate-y-1/2 -left-[6px] w-2.5 h-2.5 bg-base-100 border-l-2 border-b-2 border-error rotate-45"></div>
                  Sign out
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navbar */}
        <header className="bg-transparent border-b border-base-300/50 dark:border-white/5 h-16 flex items-center px-4 sm:px-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 -ml-1 text-base-content hover:text-primary transition-colors md:hidden"
            >
              <Menu className="h-8 w-8 stroke-[2.5]" />
            </button>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 group md:hidden"
            >
              <BookOpen className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-base-content dark:text-white">Quizzz-Zone</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2 overflow-hidden flex-1 mr-4">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {isLast ? (
                    <span className="text-sm md:text-base whitespace-nowrap truncate font-bold text-base-content">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link to={crumb.href} className="text-sm md:text-base whitespace-nowrap truncate text-base-content/60 font-medium hover:text-primary transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                  {!isLast && (
                    <ChevronRight className="h-4 w-4 text-base-content/40 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center ml-auto">
            {/* Notifications */}
            <div className="relative mr-2 sm:mr-4" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-base-content hover:bg-base-200 transition-colors relative focus:outline-none"
              >
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors" />
                {showActiveSessionNotification && (
                  <div className="absolute top-1 right-1 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-error text-white text-[10px] font-bold items-center justify-center border-2 border-base-100 leading-none">1</span>
                  </div>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="fixed left-4 right-4 top-[68px] sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 sm:max-w-[400px] bg-base-100 border border-base-300 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-base-300 flex justify-between items-center">
                    <h3 className="font-bold text-base-content">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-base-content/50 hover:text-base-content">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-3">
                    {showActiveSessionNotification ? (
                      <div className="bg-[#1D2B2E] border border-[#2A8B9D] rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#25B4CB] rounded-xl flex shrink-0 items-center justify-center text-white">
                            <Play size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#25B4CB] text-base leading-tight">Active Session Running</h3>
                            <p className="text-sm text-[#25B4CB]/70 mt-1 leading-snug">You have an ongoing classroom session.</p>
                          </div>
                        </div>
                        {showEndSessionConfirm ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-[#E55B5B] font-bold text-center">Are you sure you want to end this session?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowEndSessionConfirm(false)}
                                className="flex-1 py-2 bg-gray-600/30 text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-600/50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleEndSession}
                                className="flex-1 py-2 bg-[#E55B5B] text-white text-sm font-bold rounded-lg hover:brightness-110 transition-colors"
                              >
                                Confirm End
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <button
                              onClick={() => setShowEndSessionConfirm(true)}
                              className="w-full sm:w-auto px-4 py-2 bg-[#3A2426] text-[#E55B5B] text-sm font-bold rounded-lg hover:brightness-110 transition-colors shadow-sm flex-shrink-0 whitespace-nowrap"
                            >
                              End Session
                            </button>
                            <Link
                              to={`/classroom/teacher/${activeSession.quizId}?session=${activeSession.sessionCode}`}
                              onClick={() => setShowNotifications(false)}
                              className="w-full sm:flex-1 py-2 px-4 text-center bg-[#25B4CB] text-white text-sm font-bold rounded-lg hover:brightness-110 transition-colors shadow-sm whitespace-nowrap"
                            >
                              Resume Session
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-base-content/60 text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <ThemeSelector className="w-auto" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-base-200">
          <div className="py-4 px-4 h-full">
            <React.Suspense fallback={<Loader />}>
              <Outlet />
            </React.Suspense>
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
