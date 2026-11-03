import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth as useAppAuth } from "../Context/storeContext";

/**
 * Protected route wrapper.
 * - Redirects to /login when not authenticated
 * - Optionally restricts access by role (allowedRoles)
 */
const ProtectedRoutes = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, logout } = useAppAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if refresh token fails (api interceptor dispatches auth:logout)
  useEffect(() => {
    const handleLogout = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [logout, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoutes;
