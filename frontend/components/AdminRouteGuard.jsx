import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AdminRouteGuard({ children }) {
  const { user, isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <section className="auth-callback" aria-live="polite">
        <h1>Restoring your session...</h1>
      </section>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
