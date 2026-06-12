import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import type { UserRole } from "../types";

export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && (!auth.role || !roles.includes(auth.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
