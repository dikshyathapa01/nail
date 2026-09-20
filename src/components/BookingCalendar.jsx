import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { bookingTimes } from "../data";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingCalendar({ value, onChange, selectedTime, onTimeChange }) {
  const [month, setMonth] = useState(() => new Date());
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
    fetch(`/api/bookings/availability?date=${encodeURIComponent(value)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json();
      })
      .then((data) => setSlots(data.slots && data.slots.length ? data.slots : bookingTimes.map((time) => ({ time, available: true }))))
      .catch(() => {
        setAvailabilityError("Availability could not be checked. Please try again.");
        setSlots(bookingTimes.map((time) => ({ time, available: false })));
      })
      .finally(() => setLoading(false));
  }, [value]);

  const chooseDay = (day) => {
    const date = new Date(year, monthIndex, day);
    if (isPastDate(date)) return;
    onChange(formatDate(date));
    onTimeChange("");
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isPastMonth = year < new Date().getFullYear()
    || (year === new Date().getFullYear() && monthIndex < new Date().getMonth());

  const slotList = slots;

  return (
    <div className="calendar-card">
      <div className="calendar-head">
        <button disabled={isPastMonth} onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <strong>{month.toLocaleString("en", { month: "long", year: "numeric" })}</strong>
        <button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month">
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
          const date = formatDate(new Date(year, monthIndex, day));
          return (
            <button
              key={date}
              disabled={isPastDate(new Date(year, monthIndex, day))}
              className={`${value === date ? "selected" : ""} ${isPastDate(new Date(year, monthIndex, day)) ? "past" : ""}`}
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
            {slotList.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                className={`${selectedTime === slot.time ? "selected" : ""} ${!slot.available ? "booked" : ""}`}
                onClick={() => onTimeChange(slot.time)}
              >
                {slot.time}
                <small>{slot.available ? "Available" : "Booked"}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

