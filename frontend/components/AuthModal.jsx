import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Sparkles, X } from "lucide-react";
import { useAuth } from "../context/useAuth";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function AuthModal() {
  const { authModal, closeAuthModal } = useAuth();
  const { isOpen, message } = authModal;
  const googleButtonRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !googleClientId) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: "redirect",
        login_uri: `${window.location.origin}/api/auth/google/callback`,
      });
      googleButtonRef.current.replaceChildren();
      const buttonWidth = Math.min(360, Math.max(200, googleButtonRef.current.clientWidth));
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: "en",
        width: buttonWidth,
      });
    };

    if (window.google) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client?hl=en";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => script.remove();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Continue with Google">
        <motion.div
          className="auth-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
        />
        <motion.div
          className="auth-modal"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
        >
          <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close">
            <X size={18} />
          </button>
          <div className="auth-modal-head">
            <p className="auth-eyebrow"><Sparkles size={12} /> Studio Member Portal</p>
            <h2>Continue with Google</h2>
            {message && <p className="auth-prompt-msg">{message}</p>}
          </div>
          {error && (
            <div className="auth-banner auth-banner--error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          {!googleClientId ? (
            <div className="auth-banner auth-banner--error">
              <AlertCircle size={15} />
              <span>
                Google authentication is not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> to
                <code> frontend/.env</code>, then restart the Vite server.
              </span>
            </div>
          ) : (
            <>
              <div ref={googleButtonRef} className="google-login-button" aria-label="Continue with Google">
                <span className="sr-only">Continue with Google</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
