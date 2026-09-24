import { Menu, X, Sparkles, User, LogOut, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { useAuth } from "../context/useAuth";

const links = [
  ["HOME", "/"],
  ["PORTFOLIO", "/portfolio"],
  ["SERVICES", "/services"],
  ["CONTACT", "/contact"],
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, isAuthenticated, logout, openAuthModal, setMyBookingsOpen } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Smooth scroll directly to the date picking section
  const handleBookNow = (e) => {
    setMobileOpen(false);
    if (location.pathname === "/booking") {
      e.preventDefault();
      const el = document.getElementById("booking-calendar-section");
      if (el) {
        const yOffset = -70;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      navigate("/booking#booking-calendar-section");
    }
  };

  return (
    <header className="navbar editorial-navbar">
      <div className="shell nav-inner">
        <Logo />

        {/* Desktop nav */}
        <nav className="desktop-nav editorial-nav" aria-label="Primary">
          {links.map(([label, to]) => (
            <NavLink key={label} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-menu" ref={dropRef}>
              <button
                type="button"
                className="nav-user-pill frosted-pill-btn"
                onClick={() => setDropOpen(!dropOpen)}
                aria-expanded={dropOpen}
                aria-label="Account menu"
              >
                <span className="nav-avatar">{user.avatar}</span>
                <span className="nav-username">{user.name.split(" ")[0]}</span>
                <ChevronDown size={13} style={{ opacity: 0.6 }} />
              </button>

              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    className="nav-dropdown editorial-frosted-card"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="nav-drop-user">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <hr className="nav-drop-divider" />
                    <button
                      type="button"
                      className="nav-drop-item"
                      onClick={() => {
                        setDropOpen(false);
                        setMyBookingsOpen(true);
                      }}
                    >
                      <Calendar size={14} /> My Appointments
                    </button>
                    <button
                      type="button"
                      className="nav-drop-item nav-drop-logout"
                      onClick={() => {
                        setDropOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              type="button"
              className="frosted-pill-btn nav-signin-btn"
              onClick={() => openAuthModal({ mode: "login" })}
            >
              <User size={13} /> SIGN IN
            </button>
          )}

          <button
            type="button"
            onClick={handleBookNow}
            className="frosted-pill-btn nav-book-btn"
          >
            BOOK NOW
          </button>
        </div>

        {/* Mobile three-dash menu button (min 48x48 touch target) */}
        <button
          className="menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown when 3 dashes are clicked */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* Primary Nav Links: HOME, PORTFOLIO, SERVICES, CONTACT */}
            <div className="mobile-nav-links">
              {links.map(([label, to]) => (
                <NavLink
                  key={label}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                >
                  <span>{label}</span>
                  <ChevronRight size={16} className="mobile-nav-arrow" />
                </NavLink>
              ))}
            </div>

            {/* Prominent BOOK NOW button that redirects directly to date choosing section */}
            <div className="mobile-nav-actions">
              <button
                type="button"
                className="dark-button mobile-book-btn"
                onClick={handleBookNow}
              >
                <Sparkles size={15} />
                <span>BOOK NOW</span>
              </button>

              {/* Mobile Auth / Member Section */}
              {isAuthenticated ? (
                <div className="mobile-user-card">
                  <div className="mobile-user-info">
                    <span className="nav-avatar">{user.avatar}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <div className="mobile-user-btn-row">
                    <button
                      type="button"
                      className="frosted-pill-btn"
                      onClick={() => {
                        setMobileOpen(false);
                        setMyBookingsOpen(true);
                      }}
                    >
                      <Calendar size={13} /> My Bookings
                    </button>
                    <button
                      type="button"
                      className="frosted-pill-btn mobile-logout-btn"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-row">
                  <button
                    type="button"
                    className="frosted-pill-btn mobile-auth-pill"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal({ mode: "login" });
                    }}
                  >
                    <User size={14} /> Sign In
                  </button>
                  <button
                    type="button"
                    className="light-button mobile-auth-pill"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal({ mode: "signup" });
                    }}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
