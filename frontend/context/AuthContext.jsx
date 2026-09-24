import { useState } from "react";
import { API_BASE_URL } from "../api";
import { AuthContext } from "./auth-context";

const STORAGE_KEY_USER = "nail_inspo_auth_user";

async function requestAuth(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(result.message) ? result.message.join(", ") : result.message;
    throw new Error(message || "Unable to complete the authentication request.");
  }
  return result;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth modal state
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: "login", // "login" | "signup"
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

  const login = async ({ email, password }) => {
    const result = await requestAuth("/auth/login", { email, password });
    const sessionUser = result.user;
    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));

    // Fire callback (e.g. complete a pending booking)
    if (authModal.onSuccess) {
      authModal.onSuccess(sessionUser);
    }
    return sessionUser;
  };

  // Signup: creates account then closes modal WITHOUT logging in
  // Caller should open the login view after this resolves
  const signup = async ({ name, email, phone, password }) => {
    const result = await requestAuth("/auth/signup", { name, email, phone, password });
    return result.user;
  };

  const quickDemoLogin = async () => {
    return login({ email: "sophiya@example.com", password: "password123" });
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) { /* */ }
  };

  const getUserBookings = () => {
    if (!user) return [];
    try {
      const all = JSON.parse(localStorage.getItem("offline_nail_bookings") || "[]");
      return all
        .filter((b) => b.userId === user.id || (b.email && b.email.toLowerCase() === user.email.toLowerCase()))
        .reverse();
    } catch {
      return [];
    }
  };

  const saveBookingLocally = (data) => {
    try {
      const all = JSON.parse(localStorage.getItem("offline_nail_bookings") || "[]");
      const record = { ...data, userId: user?.id, savedAt: new Date().toISOString() };
      all.push(record);
      localStorage.setItem("offline_nail_bookings", JSON.stringify(all));
      return record;
    } catch {
      return data;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authModal,
        openAuthModal,
        closeAuthModal,
        switchAuthMode,
        login,
        signup,
        quickDemoLogin,
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

