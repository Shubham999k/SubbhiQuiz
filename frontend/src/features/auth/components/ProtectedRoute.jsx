import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loader2 } from "lucide-react";
import Loader from "../../../components/common/Loader";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-base-200"><Loader message="Loading Profile..." /></div>;
  }

  if (!user) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
