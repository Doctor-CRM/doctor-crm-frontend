import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleDashboardPath } from "../utils/roleUtils";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | string)[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const userRole = user.role.toLowerCase().trim();
    const isAllowed = allowedRoles.some(
      (role) => role.toLowerCase().trim() === userRole
    );

    if (!isAllowed) {
      // Redirect to their assigned role dashboard if unauthorized for this route
      const redirectPath = getRoleDashboardPath(user.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};
