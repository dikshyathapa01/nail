import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Check, ChevronRight, Sparkles, Calendar as CalendarIcon, Clock, CheckCircle2, ArrowRight, Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BookingCalendar from "../components/BookingCalendar";
import BookingForm from "../components/BookingForm";
import Toast from "../components/Toast";
import EditorialBackground from "../components/EditorialBackground";
import { STUDIO_PHONE } from "../data";
import { useAuth } from "../context/useAuth";

export default function Booking() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  // step 1 = pick date+time, step 2 = fill form, step 3 = confirmed
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const { user, setMyBookingsOpen } = useAuth();

  // Scroll directly to date choosing section
  useEffect(() => {
    const scrollToCalendar = () => {
      const el = document.getElementById("booking-calendar-section");
      if (el) {
        const yOffset = -70;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    const t = setTimeout(scrollToCalendar, 120);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  // Auto-advance to step 2 once both date & time chosen
  useEffect(() => {
    if (date && time && step === 1) {
      const t = setTimeout(() => {
        setStep(2);
        // Scroll to form panel when moving to step 2
        const el = document.getElementById("booking-calendar-section");
        if (el) {
          const yOffset = -70;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [date, time, step]);

  const handleSuccess = (result) => {
    setConfirmedBooking(result);
    setStep(3);
    setToast(`Booked! Thanks ${result.name || "lovely"} — we'll confirm via WhatsApp.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setDate("");
    setTime("");
    setConfirmedBooking(null);
    setStep(1);
    const el = document.getElementById("booking-calendar-section");
    if (el) {
      const yOffset = -70;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const whatsappLink = () => {
    if (!confirmedBooking) return "#";
    const text = encodeURIComponent(
      `Hello Nail Inspo! I just submitted a booking request.\n\n` +
      `• Service: ${confirmedBooking.service || "Nail Session"}\n` +
      `• Date: ${confirmedBooking.date || date}\n` +
      `• Time: ${confirmedBooking.time || time}\n` +
      `• Name: ${confirmedBooking.name || user?.name || ""}\n\n` +
      `Looking forward to my appointment!`
    );
    return `https://wa.me/${STUDIO_PHONE.replace(/\D/g, "")}?text=${text}`;
  };

  return (
    <section className="page-shell editorial-page-shell" aria-label="Booking">
      <EditorialBackground />

      <div className="shell editorial-page-content">
        {/* Page heading */}
        <motion.div
          className="page-heading booking-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow"><Sparkles size={13} /> Reserved Studio Sessions · Kathmandu</p>
          <h1 className="curated-hero-title" style={{ marginBottom: "16px" }}>
            Reserve your<br />
            <em>mindful beauty</em><br />
            &amp; bespoke session.
          </h1>
          <p className="curated-hero-desc">
            Choose your preferred date and time — then tell us a little about what you'd love.
            We'll confirm every detail directly via WhatsApp.
          </p>
        </motion.div>

        {/* Step progress bar */}
        <motion.div
          className="steps frosted-steps-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          <span className={step >= 1 ? (step > 1 ? "step-done" : "step-active") : ""}>
            <b>01</b> Choose date &amp; time
          </span>
          <ChevronRight size={14} />
          <span className={step >= 2 ? (step > 2 ? "step-done" : "step-active") : ""}>
            <b>02</b> Your details
          </span>
          <ChevronRight size={14} />
          <span className={step === 3 ? "step-active" : ""}>
            <b>03</b> Confirmed
          </span>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1 ── Date & Time picker */}
          {step === 1 && (
            <motion.div
              key="step1"
              id="booking-calendar-section"
              className="booking-layout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.38 }}
            >
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
                className="form-panel editorial-frosted-card step1-hint-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="step1-hint-content">
                  <CalendarIcon size={36} className="step1-hint-icon" />
                  <h3>Pick your date &amp; slot</h3>
                  <p>
                    Select an available date on the calendar, then choose a time window.
                    Once both are selected you'll move straight to the details form.
                  </p>

                  {/* Live selection preview */}
                  <div className="step1-selection-preview">
                    <div className={`selection-row ${date ? "filled" : ""}`}>
                      <CalendarIcon size={15} />
                      <span>{date ? <><strong>Date:</strong> {date}</> : "No date selected yet"}</span>
                      {date && <Check size={13} className="check-icon" />}
                    </div>
                    <div className={`selection-row ${time ? "filled" : ""}`}>
                      <Clock size={15} />
                      <span>{time ? <><strong>Time:</strong> {time}</> : "No time selected yet"}</span>
                      {time && <Check size={13} className="check-icon" />}
                    </div>
                  </div>

                  {date && time && (
                    <motion.button
                      type="button"
                      className="dark-button step1-continue-btn"
                      onClick={() => setStep(2)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      Continue to Details <ArrowRight size={15} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── STEP 2 ── Details form */}
          {step === 2 && (
            <motion.div
              key="step2"
              id="booking-calendar-section"
              className="booking-layout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.38 }}
            >
              <motion.div
                className="calendar-wrapper-col"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="calendar-card editorial-frosted-card">
                  <BookingCalendar
                    value={date}
                    onChange={(d) => { setDate(d); setTime(""); setStep(1); }}
                    selectedTime={time}
                    onTimeChange={(t) => { setTime(t); }}
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
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Appointment Request</p>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", margin: "6px 0 0" }}>
                      Let's make it <em>lovely.</em>
                    </h2>
                  </div>
                  <div className="panel-icon-badge"><Sparkles size={18} /></div>
                </div>

                <BookingForm date={date} time={time} onSuccess={handleSuccess} />
              </motion.div>
            </motion.div>
          )}

          {/* ── STEP 3 ── Confirmation */}
          {step === 3 && confirmedBooking && (
            <motion.div
              key="step3"
              className="booking-confirmed editorial-frosted-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              <div className="confirmed-check-wrap">
                <CheckCircle2 size={52} className="confirmed-check-icon" />
              </div>
              <span className="eyebrow">Reservation Confirmed</span>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 42px)", margin: "10px 0 14px" }}>
                We can't wait to welcome you!
              </h2>
              <p className="confirmed-sub">
                Your appointment request has been received. A studio stylist will reach out via WhatsApp
                to confirm your session details.
              </p>

              {/* Receipt */}
              <div className="confirmed-receipt">
                <div className="receipt-row"><span>Service</span><strong>{confirmedBooking.service || "Nail Session"}</strong></div>
                <div className="receipt-row"><span>Date</span><strong>{confirmedBooking.date || date}</strong></div>
                <div className="receipt-row"><span>Time</span><strong>{confirmedBooking.time || time}</strong></div>
                <div className="receipt-row"><span>Name</span><strong>{confirmedBooking.name || user?.name || "—"}</strong></div>
              </div>

              <div className="confirmed-actions">
                <a href={whatsappLink()} target="_blank" rel="noreferrer" className="dark-button whatsapp-btn">
                  <Share2 size={15} /> Send details to Studio via WhatsApp
                </a>
                <button type="button" className="frosted-pill-btn" onClick={() => setMyBookingsOpen(true)}>
                  <CalendarIcon size={14} /> View My Bookings
                </button>
                <button type="button" className="light-button" onClick={reset}>
                  Book Another Session
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </section>
  );
}
