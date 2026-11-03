import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api";
import { AuthContext } from "./auth-context";
import { io } from "socket.io-client";

const STORAGE_KEY_USER = "nail_inspo_auth_user";
const STORAGE_KEY_DEVICE = "nail_inspo_device_id";
const SYNC_CHANNEL = "nail_inspo_state_sync";

function getDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
  }
  return deviceId;
}

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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Authentication is taking too long. Please try again.");
    }
    const isLocal = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    throw new Error(isLocal
      ? "The local backend is not running. Start it with: npm --prefix backend run start:dev"
      : "Unable to reach the deployed authentication server. Verify the backend deployment and API URL.");
  } finally {
    window.clearTimeout(timeout);
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
  const channelRef = useRef(null);
  const socketRef = useRef(null);
  const refreshedTokenRef = useRef(null);
  const restorationStartedRef = useRef(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [user, setUser] = useState(() => {
    try {
      // Remove the old persistent login created by earlier versions.
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // Storage can be unavailable in private browsing contexts.
    }
    return readSessionUser();
  });
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    if (restorationStartedRef.current) return undefined;
    restorationStartedRef.current = true;

    const tokenBeingRefreshed = user?.token;
    if (!tokenBeingRefreshed) {
      setIsRestoring(false);
      return undefined;
    }
    refreshedTokenRef.current = tokenBeingRefreshed;

    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.token }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session refresh failed.");
        return response.json();
      })
      .then((result) => {
        if (!result.user || !result.token) return;
        const refreshedUser = { ...result.user, token: result.token };
        // Mark the replacement token before updating state so the effect does
        // not immediately refresh the same session again.
        refreshedTokenRef.current = refreshedUser.token;
        setUser(refreshedUser);
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(refreshedUser));
      })
      .catch(() => {
        setUser((currentUser) => {
          if (currentUser?.token !== tokenBeingRefreshed) return currentUser;
          sessionStorage.removeItem(STORAGE_KEY_USER);
          return null;
        });
      })
      .finally(() => {
        setIsRestoring(false);
      });
    return undefined;
  }, []);

  // Auth modal state
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: "login",
    message: "",
    onSuccess: null,
  });
  const authSuccessRef = useRef(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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

  useEffect(() => {
    authSuccessRef.current = authModal.onSuccess;
  }, [authModal.onSuccess]);

  const loginWithGoogle = useCallback(async (credential) => {
    setIsAuthLoading(true);
    try {
      let result;
      try {
        result = await requestAuth("/auth/google", { credential, deviceId: getDeviceId() });
      } catch (error) {
        const isOlderBackend = error instanceof Error && error.message.includes("property deviceId should not exist");
        if (!isOlderBackend) throw error;
        result = await requestAuth("/auth/google", { credential });
      }
      const sessionUser = { ...result.user, token: result.token || "" };
      refreshedTokenRef.current = sessionUser.token;
      setUser(sessionUser);
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
      channelRef.current?.postMessage({ type: "auth", user: sessionUser });
      if (authSuccessRef.current) authSuccessRef.current(sessionUser);
      return sessionUser;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const logout = () => {
    if (user?.token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      }).catch(() => {});
    }
    setUser(null);
    channelRef.current?.postMessage({ type: "auth", user: null });
    try {
      sessionStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) { /* */ }
  };

  useEffect(() => {
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(SYNC_CHANNEL) : null;
    channelRef.current = channel;
    const onMessage = (event) => {
      if (event.data?.type === "auth") {
        setUser(event.data.user);
        if (event.data.user) sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(event.data.user));
        else sessionStorage.removeItem(STORAGE_KEY_USER);
      }
      if (event.data?.type === "booking:updated") setSyncVersion((version) => version + 1);
    };
    channel?.addEventListener("message", onMessage);
    return () => {
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    socketRef.current?.disconnect();
    if (isRestoring) return undefined;
    if (!user?.token) {
      socketRef.current = null;
      return undefined;
    }
    const syncOrigin = API_BASE_URL.replace(/\/api\/?$/, "") || window.location.origin;
    const socket = io(`${syncOrigin}/sync`, { auth: { token: user.token } });
    const onBookingUpdate = (event) => {
      setSyncVersion((version) => version + 1);
      channelRef.current?.postMessage({ type: "booking:updated", event });
    };
    socket.on("booking:updated", onBookingUpdate);
    socketRef.current = socket;
    return () => {
      socket.off("booking:updated", onBookingUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isRestoring, user?.token]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.token) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error("Unable to load your appointments.");
      const data = await response.json();
      setSyncVersion((version) => version + 1);
      channelRef.current?.postMessage({ type: "booking:updated" });
      return data;
    } catch (err) {
      console.error("fetchAppointments failed:", err);
      throw err;
    }
  }, [user?.token]);

  const getUserBookings = fetchAppointments;

  const saveBookingLocally = (data) => data;

  return (
    <AuthContext.Provider
      value={{
        user,
        adminToken: user?.adminToken || (user?.role === "admin" ? user.token : ""),
        isAuthenticated: !!user,
        isRestoring,
        authModal,
        openAuthModal,
        closeAuthModal,
        switchAuthMode,
        loginWithGoogle,
        isAuthLoading,
        logout,
        fetchAppointments,
        getUserBookings,
        syncVersion,
        saveBookingLocally,
        myBookingsOpen,
        setMyBookingsOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
