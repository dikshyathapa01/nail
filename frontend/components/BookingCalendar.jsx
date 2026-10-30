import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { API_BASE_URL } from "../api";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingCalendar({
  value,
  onChange,
  selectedTime,
  onTimeChange,
  refreshKey = 0,
  viewMonth: controlledMonth,
  onViewMonthChange: setControlledMonth,
}) {
  const [internalMonth, setInternalMonth] = useState(() => {
    if (value) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date();
  });

  const month = controlledMonth || internalMonth;
  const setMonth = useCallback(
    (updater) => {
      if (setControlledMonth) {
        setControlledMonth(updater);
      } else {
        setInternalMonth(updater);
      }
    },
    [setControlledMonth]
  );

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();

  useEffect(() => {
    if (!value) {
      setSlots([]);
      setAvailabilityError("");
      return;
    }
    setLoading(true);
    setSlots([]);
    setAvailabilityError("");

    const controller = new AbortController();

    fetch(`${API_BASE_URL}/bookings/availability?date=${encodeURIComponent(value)}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json();
      })
      .then((data) => {
        setSlots(data.slots || []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("API error details:", err);
        setAvailabilityError("Availability could not be checked. Please try again.");
        setSlots([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [value, refreshKey]);

  const getMinimumBookingDate = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    return today;
  }, []);

  const isUnavailableDate = useCallback((date) => {
    const minimumDate = getMinimumBookingDate();
    return date < minimumDate;
  }, [getMinimumBookingDate]);

  const chooseDay = useCallback((day) => {
    const date = new Date(year, monthIndex, day);
    if (isUnavailableDate(date)) return;
    onChange(formatDate(date));
    onTimeChange("");
  }, [year, monthIndex, isUnavailableDate, onChange, onTimeChange]);

  const prevMonth = useCallback(() => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, [setMonth]);

  const nextMonth = useCallback(() => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, [setMonth]);

  const minimumBookingDate = getMinimumBookingDate();
  const isPastMonth = year < minimumBookingDate.getFullYear()
    || (year === minimumBookingDate.getFullYear() && monthIndex < minimumBookingDate.getMonth());

  return (
    <div className="calendar-card">
      <div className="calendar-head">
        <button disabled={isPastMonth} onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <strong>{month.toLocaleString("en", { month: "long", year: "numeric" })}</strong>
        <button onClick={nextMonth} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-days">
        {Array.from({ length: first }).map((_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
          const dateValue = formatDate(new Date(year, monthIndex, day));
          const unavailable = isUnavailableDate(new Date(year, monthIndex, day));
          return (
            <button
              key={dateValue}
              disabled={unavailable}
              className={`${value === dateValue ? "selected" : ""} ${unavailable ? "past" : ""}`}
              onClick={() => chooseDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="slot-area">
        <div className="slot-heading">
          <span>{value ? "Available windows" : "Choose a date"}</span>
          {loading && <LoaderCircle className="spin" size={15} />}
        </div>
        {availabilityError && <small className="form-error">{availabilityError}</small>}
        {value && (
          <div className="slots">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                className={`${selectedTime === slot.time ? "selected" : ""} ${slot.available ? "available" : slot.status === "pending" ? "pending" : "booked"}`}
                onClick={() => onTimeChange(slot.time)}
              >
                <span className="slot-inner">
                  <span className="slot-dot" />
                  <span className="slot-text">
                    {slot.time}
                    <small>{slot.available ? "Available" : availabilityError ? "Unavailable" : slot.status === "pending" ? "Pending" : "Booked"}</small>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
