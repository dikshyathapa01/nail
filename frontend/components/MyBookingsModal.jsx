import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Calendar, Clock, MapPin, Sparkles, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { STUDIO_PHONE } from "../data";

export default function MyBookingsModal() {
  const { myBookingsOpen, setMyBookingsOpen, user, getUserBookings } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ date: "", time: "", notes: "" });

  useEffect(() => {
    if (!myBookingsOpen) return;
    setError("");
    getUserBookings().then(setBookings).catch((err) => setError(err.message));
  }, [myBookingsOpen, getUserBookings]);

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusyId(id);
    try {
      const response = await fetch(`${import.meta.env.PROD ? "/api" : "http://localhost:5000/api"}/appointments/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to cancel appointment.");
      setBookings((current) => current.map((booking) => booking.id === id ? result : booking));
    } catch (err) { setError(err.message); } finally { setBusyId(""); }
  };

  const saveBooking = async (id) => {
    setBusyId(id);
    try {
      const response = await fetch(`${import.meta.env.PROD ? "/api" : "http://localhost:5000/api"}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(editForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(", ") : result.message || "Unable to update appointment.");
      setBookings((current) => current.map((booking) => booking.id === id ? result : booking));
      setEditingId("");
    } catch (err) { setError(err.message); } finally { setBusyId(""); }
  };

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
            {error && <p className="form-error">{error}</p>}
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
                      <CheckCircle2 size={12} /> {b.status === "cancelled" ? "Cancelled" : b.status === "pending" ? "Requested" : "Confirmed"}
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
                  {editingId === b.id && (
                    <div className="booking-edit-form">
                      <label>Date <input type="date" value={editForm.date} onChange={(event) => setEditForm({ ...editForm, date: event.target.value })} /></label>
                      <label>Time <input value={editForm.time} placeholder="09:00 - 10:30" onChange={(event) => setEditForm({ ...editForm, time: event.target.value })} /></label>
                      <label>Nail art preferences <textarea rows={2} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
                      <div className="mobile-user-btn-row">
                        <button type="button" className="dark-button" disabled={busyId === b.id} onClick={() => saveBooking(b.id)}>Save changes</button>
                        <button type="button" className="light-button" onClick={() => setEditingId("")}>Close</button>
                      </div>
                    </div>
                  )}
                  <p className="booking-card-footer">
                    {["pending", "confirmed"].includes(b.status) && (
                      <>
                        <button type="button" className="light-button" onClick={() => {
                          setEditingId(b.id);
                          setEditForm({ date: b.date || "", time: b.time || "", notes: b.notes || "" });
                        }}><Pencil size={13} /> Edit</button>
                        <button type="button" className="light-button" disabled={busyId === b.id} onClick={() => cancelBooking(b.id)}>
                          {busyId === b.id ? "Cancelling..." : "Cancel appointment"}
                        </button>
                      </>
                    )}
                    <span>Need to reschedule? Call/WhatsApp {STUDIO_PHONE}</span>
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
