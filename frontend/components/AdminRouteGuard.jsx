import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AdminRouteGuard({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
