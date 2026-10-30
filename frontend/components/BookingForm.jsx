import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight, Lock } from "lucide-react";
import { services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import InstagramIcon from "./InstagramIcon";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";
import { validateEmail } from "../utils/emailValidator";

export default function BookingForm({ date, time, onSuccess, onSlotUnavailable, restoredBooking }) {
  const { user, isAuthenticated, openAuthModal, fetchAppointments } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get("service");
  const defaultService =
    services.find((s) => s.name.toLowerCase() === serviceParam?.toLowerCase())?.name ||
    services[0].name;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { service: defaultService } });

  // Sync service from URL param
  useEffect(() => {
    if (serviceParam) {
      const matched = services.find(
        (s) => s.name.toLowerCase() === serviceParam.toLowerCase()
      );
      if (matched) setValue("service", matched.name);
    }
  }, [serviceParam, setValue]);

  // Pre-fill from restored booking data if returning from OAuth / error
  useEffect(() => {
    if (restoredBooking) {
      if (restoredBooking.name) setValue("name", restoredBooking.name);
      if (restoredBooking.phone) setValue("phone", restoredBooking.phone);
      if (restoredBooking.email) setValue("email", restoredBooking.email);
      if (restoredBooking.service) setValue("service", restoredBooking.service);
      if (restoredBooking.notes) setValue("notes", restoredBooking.notes);
    }
  }, [restoredBooking, setValue]);

  // Pre-fill name / email / phone from logged-in user
  useEffect(() => {
    if (user) {
      if (user.name) setValue("name", user.name);
      if (user.email) setValue("email", user.email);
      if (user.phone) setValue("phone", user.phone);
    }
  }, [user, setValue]);

  const doSubmit = async (values, sessionToken = user?.token) => {
    setSubmitError("");

    const minimumDate = new Date();
    minimumDate.setHours(0, 0, 0, 0);
    minimumDate.setDate(minimumDate.getDate() + 1);
    const minimumDateValue = [
      minimumDate.getFullYear(),
      String(minimumDate.getMonth() + 1).padStart(2, "0"),
      String(minimumDate.getDate()).padStart(2, "0"),
    ].join("-");

    if (!date || date < minimumDateValue) {
      setSubmitError("Please choose an appointment date from tomorrow onward.");
      return;
    }

    const payload = { ...values, date, time };

    try {
      if (!sessionToken) {
        setSubmitError("Your sign-in session is not ready yet. Please try again.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        // Immediately trigger re-fetch of appointment history before success confirmation
        if (fetchAppointments) {
          await fetchAppointments().catch(() => {});
        }
        reset();
        await onSuccess(result);
        return;
      }

      const result = await res.json().catch(() => ({}));
      const message = Array.isArray(result.message) ? result.message.join(", ") : result.message;
      if (res.status === 401) {
        openAuthModal({
          mode: "login",
          message: "Your sign-in session expired. Sign in again to confirm this booking.",
          onSuccess: (sessionUser) => {
            doSubmit(values, sessionUser?.token);
          },
        });
        return;
      }
      if (res.status === 409 && /only one active appointment/i.test(message || "")) {
        setSubmitError("You already have an active appointment. Cancel or wait for that appointment before requesting another.");
        return;
      }
      if (res.status === 409 && /already requested|already confirmed|currently pending|unavailable/i.test(message || "")) {
        onSlotUnavailable?.();
        setSubmitError(message || "That slot is no longer available. Please choose another time.");
        return;
      }
      setSubmitError(message || "Unable to confirm booking.");
      return;
    } catch (error) {
      if (!(error instanceof TypeError)) {
        setSubmitError(error instanceof Error ? error.message : "Unable to confirm booking.");
        return;
      }

      setSubmitError("The booking service is unavailable. Please try again when you are online.");
    }
  };

  // Auth guard on submit: if user not logged in, capture pending booking draft and open auth modal
  const submit = (values) => {
    if (!isAuthenticated) {
      const bookingData = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        service: values.service,
        notes: values.notes,
        date,
        time,
      };
      try {
        sessionStorage.setItem("pending_booking", JSON.stringify(bookingData));
      } catch (e) {
        console.error("Failed to save pending booking draft:", e);
      }

      openAuthModal({
        mode: "login",
        message: `Sign in to finalise your booking for ${values.service || "your session"} on ${date}.`,
        onSuccess: (sessionUser) => {
          // After login the form still has data; re-trigger submit programmatically
          doSubmit(values, sessionUser?.token);
        },
      });
      return;
    }
    return doSubmit(values);
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit, () => {})}>
      {/* Authenticated indicator */}
      {isAuthenticated && (
        <div className="booking-auth-indicator">
          <span className="booking-auth-dot" />
          <span>
            Signed in as <strong>{user.name}</strong>
          </span>
        </div>
      )}

      <div className="field-grid">
        <label>
          Name
          <input
            {...register("name", {
              required: "Your name is required",
              minLength: { value: 2, message: "Please enter your full name" },
            })}
            placeholder="Your name"
          />
          {errors.name && <small className="form-error">{errors.name.message}</small>}
        </label>
        <label>
          Phone
          <input
            {...register("phone", {
              required: "Your phone number is required",
              pattern: {
                value: /^\d{10}$/,
                message: "Enter exactly 10 digits",
              },
            })}
            maxLength={10}
            inputMode="numeric"
            placeholder="98XXXXXXXX"
          />
          {errors.phone && <small className="form-error">{errors.phone.message}</small>}
        </label>
      </div>

      <label>
        Email
        <input
          type="email"
          {...register("email", {
            validate: (val) => {
              if (!val) return true;
              const check = validateEmail(val);
              return check.isValid || check.error;
            },
          })}
          placeholder="you@example.com"
        />
        {errors.email && <small className="form-error">{errors.email.message}</small>}
      </label>

      <label>
        Nail Service / Set
        <select {...register("service")}>
          {services.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} · {s.duration}
            </option>
          ))}
        </select>
      </label>

      <label>
        Custom Notes / Nail Shape &amp; Inspo
        <textarea
          rows={2}
          {...register("notes")}
          placeholder="E.g., Almond shape, custom press-on sizing, reference photo from Instagram..."
        />
      </label>

      <div className="booking-summary">
        <span>Date <b>{date || "Select a date above"}</b></span>
        <span>Time <b>{time || "Select a window"}</b></span>
      </div>

      {/* Show lock hint if not authenticated */}
      {!isAuthenticated && (
        <div className="booking-auth-hint">
          <Lock size={13} />
          <span>You can fill in your details now. You'll be asked to <strong>sign in</strong> when you confirm.</span>
        </div>
      )}

      <button
        className="dark-button submit-button"
        disabled={!date || !time || isSubmitting}
      >
        {isSubmitting
          ? <><span className="button-spinner" aria-hidden="true" /> Sending request...</>
          : isAuthenticated
          ? "Confirm Studio Appointment"
          : "Continue & Sign In to Confirm"}{" "}
        {!isSubmitting && <ArrowRight size={16} />}
      </button>

      {submitError && (
        <small className="form-error booking-submit-error">{submitError}</small>
      )}

      <div className="booking-insta-help">
        <InstagramIcon size={14} />
        <span>
          Prefer to order custom press-ons via DM? Reach us at{" "}
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            <strong>{INSTAGRAM_HANDLE}</strong>
          </a>
        </span>
      </div>
    </form>
  );
}
