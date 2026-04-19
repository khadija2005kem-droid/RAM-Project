import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthToken, getStoredUser, AUTH_KEYS, normalizeRole } from "../../utils/auth";

export function getAuthUser() {
  const token = getAuthToken() || "";
  const user = getStoredUser();
  const storedRole = localStorage.getItem(AUTH_KEYS.role) || sessionStorage.getItem(AUTH_KEYS.role);
  const role = normalizeRole(storedRole || user?.role);

  return {
    token,
    user,
    role,
    isAuthenticated: Boolean(token),
  };
}

function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const { isAuthenticated, role } = getAuthUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedAllowed = allowedRoles.map((allowedRole) => normalizeRole(allowedRole));
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(role)) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "client") return <Navigate to="/home" replace />;
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
