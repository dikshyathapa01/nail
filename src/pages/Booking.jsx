import { useState } from "react";
import { Check, ChevronRight, Sparkles, Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion } from "framer-motion";
import BookingCalendar from "../components/BookingCalendar";
import BookingForm from "../components/BookingForm";
import Toast from "../components/Toast";
import EditorialBackground from "../components/EditorialBackground";

export default function Booking() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [toast, setToast] = useState("");

  return (
    <section className="page-shell editorial-page-shell" aria-label="Booking">
      <EditorialBackground />

      <div className="shell editorial-page-content">
        <motion.div
          className="page-heading booking-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">
            <Sparkles size={13} /> Reserved Studio Sessions · Kathmandu
          </p>
          <h1 className="curated-hero-title" style={{ marginBottom: "16px" }}>
            Reserve your<br />
            <em>mindful beauty</em><br />
            &amp; bespoke session.
          </h1>
          <p className="curated-hero-desc">
            Choose your preferred date and time for an in-studio appointment or custom press-on consultation.
            We will review and confirm all details with you directly via WhatsApp or phone.
          </p>
        </motion.div>

        <motion.div
          className="steps frosted-steps-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          <span className={date ? "step-done" : "step-active"}>
            <b>01</b> Choose a date
          </span>
          <ChevronRight size={14} />
          <span className={time ? "step-done" : date ? "step-active" : ""}>
            <b>02</b> Pick a window
          </span>
          <ChevronRight size={14} />
          <span className={time ? "step-active" : ""}>
            <b>03</b> Tell us about you
          </span>
        </motion.div>

        <div className="booking-layout">
          <motion.div
            className="calendar-wrapper-col"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="calendar-card editorial-frosted-card">
              <BookingCalendar
                value={date}
                onChange={setDate}
                selectedTime={time}
                onTimeChange={setTime}
              />
              <div className="legend">
                <span><i className="available-dot" /> Available</span>
                <span><i className="booked-dot" /> Booked</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="form-panel editorial-frosted-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Appointment Request</p>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", margin: "6px 0 0" }}>
                  Let's make it <em>lovely.</em>
                </h2>
              </div>
              <div className="panel-icon-badge">
                <Sparkles size={18} />
              </div>
            </div>

            <BookingForm
              date={date}
              time={time}
              onSuccess={(result) => {
                setToast(`Thanks ${result.name || "lovely"}, your appointment request has been received.`);
                setDate("");
                setTime("");
              }}
            />
          </motion.div>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </section>
  );
}
