import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Calendar, Clock, MapPin, Sparkles, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { STUDIO_PHONE } from "../data";
import { API_BASE_URL } from "../api";

function getMinimumBookingDate() {
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  minimumDate.setDate(minimumDate.getDate() + 1);
  const month = String(minimumDate.getMonth() + 1).padStart(2, "0");
  const day = String(minimumDate.getDate()).padStart(2, "0");
  return `${minimumDate.getFullYear()}-${month}-${day}`;
}

export default function MyBookingsModal() {
  const { myBookingsOpen, setMyBookingsOpen, user, getUserBookings, fetchAppointments, syncVersion } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ date: "", time: "", notes: "" });
  const [editOriginal, setEditOriginal] = useState(null);
  const [editSlots, setEditSlots] = useState([]);
  const [editSlotsLoading, setEditSlotsLoading] = useState(false);
  const [editSlotsError, setEditSlotsError] = useState("");

  useEffect(() => {
    if (!myBookingsOpen) return;
    setError("");
    const load = fetchAppointments || getUserBookings;
    load().then(setBookings).catch((err) => setError(err.message));
  }, [myBookingsOpen, fetchAppointments, getUserBookings, syncVersion]);

  useEffect(() => {
    if (!editingId || !editForm.date) {
      setEditSlots([]);
      setEditSlotsError("");
      return undefined;
    }

    const controller = new AbortController();
    setEditSlotsLoading(true);
    setEditSlotsError("");
    fetch(`${API_BASE_URL}/bookings/availability?date=${encodeURIComponent(editForm.date)}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Availability could not be checked.");
        return response.json();
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        setEditSlots(result.slots || []);
      })
      .catch((availabilityError) => {
        if (availabilityError.name !== "AbortError") {
          setEditSlotsError(availabilityError.message);
          setEditSlots([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setEditSlotsLoading(false);
      });

    return () => controller.abort();
  }, [editingId, editForm.date]);

  const editIsDirty = Boolean(editOriginal && (
    editForm.date !== editOriginal.date
    || editForm.time !== editOriginal.time
    || editForm.notes !== editOriginal.notes
  ));

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusyId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to cancel appointment.");
      setBookings((current) => current.filter((booking) => booking.id !== id));
    } catch (err) { setError(err.message); } finally { setBusyId(""); }
  };

  const saveBooking = async (id) => {
    if (!editForm.date || editForm.date < getMinimumBookingDate()) {
      setError("Appointments must be scheduled from tomorrow onward.");
      return;
    }
    setBusyId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(editForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(", ") : result.message || "Unable to update appointment.");
      setBookings((current) => current.map((booking) => booking.id === id ? result : booking));
      setEditingId("");
      setEditOriginal(null);
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
                      <label className={editForm.date !== editOriginal?.date ? "field-modified" : ""}>Date <input
                        type="date"
                        min={getMinimumBookingDate()}
                        value={editForm.date}
                        onChange={(event) => {
                          const date = event.target.value;
                          setEditForm((current) => ({
                            ...current,
                            date: date >= getMinimumBookingDate() ? date : current.date,
                            time: date === current.date ? current.time : "",
                          }));
                        }}
                      /></label>
                      <fieldset className={editForm.time !== editOriginal?.time ? "field-modified" : ""}>
                        <legend>Time</legend>
                        {editSlotsLoading && <small>Checking available windows...</small>}
                        {editSlotsError && <small className="form-error">{editSlotsError}</small>}
                        {!editSlotsLoading && !editSlotsError && (
                          <div className="slots" role="group" aria-label="Available appointment times">
                            {editSlots.map((slot) => {
                              const isCurrentSlot = editForm.date === editOriginal?.date && slot.time === editOriginal?.time;
                              const available = slot.available || isCurrentSlot;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!available}
                                  className={`${editForm.time === slot.time ? "selected" : ""} ${available ? "available" : "booked"}`}
                                  onClick={() => setEditForm((current) => ({ ...current, time: slot.time }))}
                                >
                                  {slot.time}
                                  <small>{available ? "Available" : "Booked"}</small>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </fieldset>
                      <label className={editForm.notes !== editOriginal?.notes ? "field-modified" : ""}>Nail art preferences <textarea rows={2} value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} /></label>
                      {editIsDirty && <span className="booking-edit-dirty">Unsaved changes</span>}
                      <div className="mobile-user-btn-row">
                        <button type="button" className="dark-button" disabled={busyId === b.id || !editIsDirty || !editForm.time} onClick={() => saveBooking(b.id)}>Save changes</button>
                        <button type="button" className="light-button" onClick={() => { setEditingId(""); setEditOriginal(null); }}>Close</button>
                      </div>
                    </div>
                  )}
                  <p className="booking-card-footer">
                    {["pending", "confirmed"].includes(b.status) && (
                      <>
                        <button type="button" className="light-button" onClick={() => {
                          setEditingId(b.id);
                            const initial = { date: b.date || "", time: b.time || "", notes: b.notes || "" };
                            setEditForm(initial);
                            setEditOriginal(initial);
                            setEditSlotsError("");
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
