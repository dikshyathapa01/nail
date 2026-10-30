import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";

export default function AuthCallback() {
  const { loginWithGoogle, fetchAppointments } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const submittedCredentialRef = useRef("");

  useEffect(() => {
    let active = true;
    const credential = new URLSearchParams(window.location.hash.slice(1)).get("credential");
    const redirectError = searchParams.get("error");

    if (redirectError) {
      setError(redirectError);
      return undefined;
    }
    if (!credential) {
      setError("Google sign-in did not return a credential.");
      return undefined;
    }
    if (submittedCredentialRef.current === credential) return undefined;
    submittedCredentialRef.current = credential;

    loginWithGoogle(credential)
      .then(async (sessionUser) => {
        if (!active) return;

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
                if (active) {
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
                if (active) {
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
              if (active) {
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

        if (active) {
          window.history.replaceState(null, "", window.location.pathname);
          navigate("/", { replace: true });
        }
      })
      .catch((loginError) => {
        if (active) {
          setError(loginError instanceof Error ? loginError.message : "Google sign-in failed.");
        }
      });

    return () => {
      active = false;
    };
  }, [fetchAppointments, loginWithGoogle, navigate, searchParams]);

  return (
    <section className="auth-callback" aria-live="polite">
      <h1>{error ? "Unable to sign you in" : "Signing you in..."}</h1>
      {error && <p>{error}</p>}
    </section>
  );
}
