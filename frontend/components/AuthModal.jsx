import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User, Phone, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { validateEmail } from "../utils/emailValidator";

export default function AuthModal() {
  const { authModal, closeAuthModal, switchAuthMode, login, signup, quickDemoLogin } = useAuth();
  const { isOpen, mode, message } = authModal;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset on open/mode change
  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuggestion("");
      setSuccessMsg("");
      setShowPw(false);
    }
  }, [isOpen, mode]);

  // Escape key
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape" && isOpen) closeAuthModal(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, closeAuthModal]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuggestion("");
    setSuccessMsg("");

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error);
      if (emailCheck.suggestion) {
        setSuggestion(emailCheck.suggestion);
      }
      return;
    }

    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    if (mode === "signup") {
      if (!name.trim() || name.trim().length < 2) { setError("Please enter your full name."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      setLoading(true);
      try {
        await signup({ name, email, phone, password });
        // Per user's rule: after signup show success then switch to login
        setSuccessMsg("Account created! Please sign in with your new credentials.");
        setPassword(""); setConfirmPassword(""); setName(""); setPhone("");
        setTimeout(() => switchAuthMode("login"), 1400);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    setLoading(true);
    try {
      await login({ email, password });
      closeAuthModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(""); setLoading(true);
    try {
      await quickDemoLogin();
      closeAuthModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label={mode === "login" ? "Sign in" : "Create account"}>
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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close">
              <X size={18} />
            </button>

            <div className="auth-modal-head">
              <p className="auth-eyebrow"><Sparkles size={12} /> Studio Member Portal</p>
              <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
              {message && <p className="auth-prompt-msg">{message}</p>}
            </div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab${mode === "login" ? " active" : ""}`}
                onClick={() => { switchAuthMode("login"); setError(""); setSuccessMsg(""); }}
              >Sign In</button>
              <button
                type="button"
                className={`auth-tab${mode === "signup" ? " active" : ""}`}
                onClick={() => { switchAuthMode("signup"); setError(""); setSuccessMsg(""); }}
              >Create Account</button>
            </div>

            {/* Error / success banners */}
            <AnimatePresence>
              {error && (
                <motion.div className="auth-banner auth-banner--error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <AlertCircle size={15} />
                  <div>
                    <span>{error}</span>
                    {suggestion && (
                      <button
                        type="button"
                        style={{
                          display: "block",
                          marginTop: "4px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          color: "#b91c1c",
                          cursor: "pointer",
                          padding: "0",
                        }}
                        onClick={() => {
                          setEmail(suggestion);
                          setError("");
                          setSuggestion("");
                        }}
                      >
                        Click to use {suggestion}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
              {successMsg && (
                <motion.div className="auth-banner auth-banner--success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <span>✓ {successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {mode === "signup" && (
                <>
                  <div className="auth-field">
                    <label htmlFor="auth-name">Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input id="auth-name" type="text" placeholder="e.g. Sophiya Sharma" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="auth-phone">Phone / WhatsApp <span className="auth-optional">(optional)</span></label>
                    <div className="auth-input-wrap">
                      <Phone size={16} className="auth-input-icon" />
                      <input id="auth-phone" type="tel" placeholder="+977 98..." value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                    </div>
                  </div>
                </>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input id="auth-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPw ? "text" : "password"}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide" : "Show"}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input id="auth-confirm" type={showPw ? "text" : "password"} placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                  </div>
                </div>
              )}

              <button type="submit" className="dark-button auth-submit-btn" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? (<><span>Sign In</span><ArrowRight size={15} /></>) : (<><span>Create Account</span><ArrowRight size={15} /></>)}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <button type="button" className="frosted-pill-btn auth-demo-btn" onClick={handleDemo} disabled={loading}>
              <ShieldCheck size={15} />
              <span>1-tap demo login (Sophiya Sharma)</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
