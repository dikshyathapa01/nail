import { useCallback, useState } from "react";
import { API_BASE_URL } from "../api";
import { AuthContext } from "./auth-context";

const STORAGE_KEY_USER = "nail_inspo_auth_user";

function readSessionUser() {
  try {
    // Keep the signed-in state only for the current browser tab.
    const saved = sessionStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

async function requestAuth(path, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Unable to reach the authentication server. Please check that the backend is running and deployed.",
    );
  }
  const result = await response.json().catch(() => ({}));
  if (response.status === 404 && path === "/auth/google") {
    throw new Error(
      "Google sign-in is not available on the deployed backend yet. Redeploy the backend with the latest code.",
    );
  }
  if (!response.ok) {
    const message = Array.isArray(result.message) ? result.message.join(", ") : result.message;
    throw new Error(message || "Unable to complete the authentication request.");
  }
  return result;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Remove the old persistent login created by earlier versions.
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // Storage can be unavailable in private browsing contexts.
    }
    return readSessionUser();
  });

  // Auth modal state
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: "login",
    message: "",
    onSuccess: null,
  });

  // My bookings modal
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);

  const openAuthModal = ({ mode = "login", message = "", onSuccess = null } = {}) => {
    setAuthModal({ isOpen: true, mode, message, onSuccess });
  };

  const closeAuthModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, onSuccess: null }));
  };

  const switchAuthMode = (mode) => {
    setAuthModal((prev) => ({ ...prev, mode }));
  };

  const loginWithGoogle = async (credential) => {
    const result = await requestAuth("/auth/google", { credential });
    const sessionUser = { ...result.user, token: result.token || "" };
    setUser(sessionUser);
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
    if (authModal.onSuccess) authModal.onSuccess(sessionUser);
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) { /* */ }
  };

  const getUserBookings = useCallback(async () => {
    if (!user?.token) return [];
    const response = await fetch(`${API_BASE_URL}/appointments/mine`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (!response.ok) throw new Error("Unable to load your appointments.");
    return response.json();
  }, [user]);

  const saveBookingLocally = (data) => data;

  return (
    <AuthContext.Provider
      value={{
        user,
        adminToken: user?.adminToken || "",
        isAuthenticated: !!user,
        authModal,
        openAuthModal,
        closeAuthModal,
        switchAuthMode,
        loginWithGoogle,
        logout,
        getUserBookings,
        saveBookingLocally,
        myBookingsOpen,
        setMyBookingsOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
