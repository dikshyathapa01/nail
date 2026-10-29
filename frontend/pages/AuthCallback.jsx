import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AuthCallback() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

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

    loginWithGoogle(credential)
      .then(() => {
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
  }, [loginWithGoogle, navigate, searchParams]);

  return (
    <section className="auth-callback" aria-live="polite">
      <h1>{error ? "Unable to sign you in" : "Signing you in..."}</h1>
      {error && <p>{error}</p>}
    </section>
  );
}
