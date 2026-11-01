import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";

export default function AuthCallback() {
  const { loginWithGoogle, fetchAppointments } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasHandledAuthRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const credential = new URLSearchParams(window.location.hash.slice(1)).get("credential");
    const redirectError = searchParams.get("error");

    if (redirectError) {
      setError(redirectError);
      setIsLoading(false);
      return undefined;
    }
    if (!credential) {
      // The callback route can briefly render before the redirect hash is
      // available. Do not turn that pending state into a sign-in failure.
      return undefined;
    }
    if (hasHandledAuthRef.current) return undefined;
    hasHandledAuthRef.current = true;
    setError("");
    setIsLoading(true);

    loginWithGoogle(credential)
      .then(async (sessionUser) => {
        if (!isMountedRef.current) return;

        const pendingBookingRaw = sessionStorage.getItem("pending_booking");
        if (pendingBookingRaw) {
          sessionStorage.removeItem("pending_booking");
          let bookingData = null;
          try {
            bookingData = JSON.parse(pendingBookingRaw);
          } catch (e) {
            console.error("Failed to parse pending booking:", e);
          }

          if (bookingData) {
            try {
              const res = await fetch(`${API_BASE_URL}/appointments`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionUser?.token || ""}`,
                },
                body: JSON.stringify(bookingData),
              });

              if (res.ok) {
                const result = await res.json();
                if (fetchAppointments) {
                  await fetchAppointments().catch(() => {});
                }
                if (isMountedRef.current) {
                  window.history.replaceState(null, "", window.location.pathname);
                  navigate("/booking", {
                    replace: true,
                    state: { confirmedBooking: result, fromOAuth: true },
                  });
                  return;
                }
              } else {
                const errResult = await res.json().catch(() => ({}));
                const errMsg = Array.isArray(errResult.message)
                  ? errResult.message.join(", ")
                  : errResult.message;
                if (isMountedRef.current) {
                  window.history.replaceState(null, "", window.location.pathname);
                  navigate("/booking", {
                    replace: true,
                    state: {
                      restoredBooking: bookingData,
                      bookingError: errMsg || "Slot unavailable. Please choose another date or time.",
                    },
                  });
                  return;
                }
              }
            } catch (postErr) {
              console.error("Auto-booking request failed:", postErr);
              if (isMountedRef.current) {
                window.history.replaceState(null, "", window.location.pathname);
                navigate("/booking", {
                  replace: true,
                  state: {
                    restoredBooking: bookingData,
                    bookingError: "Could not finalize booking automatically. Please review your details below.",
                  },
                });
                return;
              }
            }
          }
        }

        if (isMountedRef.current) {
          window.history.replaceState(null, "", window.location.pathname);
          navigate("/", { replace: true });
        }
      })
      .catch((loginError) => {
        if (isMountedRef.current) {
          setError(loginError instanceof Error ? loginError.message : "Google sign-in failed.");
          setIsLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAppointments, loginWithGoogle, navigate, searchParams]);

  return (
    <section className="auth-callback" aria-live="polite">
      <h1>{isLoading ? "Signing you in..." : error ? "Unable to sign you in" : "Sign-in cancelled"}</h1>
      {!isLoading && error && <p>{error}</p>}
    </section>
  );
}
