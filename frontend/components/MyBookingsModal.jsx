import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { STUDIO_PHONE } from "../data";

export default function MyBookingsModal() {
  const { myBookingsOpen, setMyBookingsOpen, user, getUserBookings } = useAuth();
  const bookings = getUserBookings();

  if (!myBookingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="My Appointments">
        <motion.div
          className="auth-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMyBookingsOpen(false)}
        />
        <motion.div
          className="auth-modal auth-modal--wide"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="auth-modal-close" onClick={() => setMyBookingsOpen(false)} aria-label="Close">
            <X size={18} />
          </button>

          <div className="auth-modal-head">
            <p className="auth-eyebrow"><Sparkles size={12} /> Studio Reservations</p>
            <h2>My Appointments</h2>
            {user && <p className="auth-prompt-msg">Hello, <strong>{user.name}</strong>. Here's your booking history.</p>}
          </div>

          <div className="my-bookings-list">
            {bookings.length === 0 ? (
              <div className="my-bookings-empty">
                <AlertCircle size={32} style={{ opacity: 0.35 }} />
                <h3>No appointments yet</h3>
                <p>You haven't made any studio bookings. Ready for your next set?</p>
                <Link to="/booking" className="explore-pill-btn" onClick={() => setMyBookingsOpen(false)}>
                  Book a Session
                </Link>
              </div>
            ) : (
              bookings.map((b, idx) => (
                <article key={b.id || idx} className="booking-card">
                  <div className="booking-card-top">
                    <span className="booking-service-name">{b.service || "Nail Session"}</span>
                    <span className="booking-status-pill">
                      <CheckCircle2 size={12} /> {b.status === "confirmed_offline" ? "Requested" : "Confirmed"}
                    </span>
                  </div>
                  <div className="booking-card-meta">
                    <span><Calendar size={13} /> {b.date}</span>
                    <span><Clock size={13} /> {b.time}</span>
                    <span><MapPin size={13} /> Kathmandu Studio</span>
                  </div>
                  {b.notes && (
                    <p className="booking-card-notes">
                      <em>Notes:</em> {b.notes}
                    </p>
                  )}
                  <p className="booking-card-footer">
                    Need to reschedule? Call/WhatsApp {STUDIO_PHONE}
                  </p>
                </article>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
