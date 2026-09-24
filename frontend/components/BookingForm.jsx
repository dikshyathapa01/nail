import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight, Lock } from "lucide-react";
import { services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import InstagramIcon from "./InstagramIcon";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";
import { validateEmail } from "../utils/emailValidator";

export default function BookingForm({ date, time, onSuccess }) {
  const { user, isAuthenticated, openAuthModal, saveBookingLocally } = useAuth();
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

  // Pre-fill name / email / phone from logged-in user
  useEffect(() => {
    if (user) {
      if (user.name) setValue("name", user.name);
      if (user.email) setValue("email", user.email);
      if (user.phone) setValue("phone", user.phone);
    }
  }, [user, setValue]);

  const doSubmit = async (values) => {
    setSubmitError("");
    const payload = { ...values, date, time, userId: user?.id };

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        saveBookingLocally({ ...payload, id: result.id, status: "confirmed" });
        reset();
        onSuccess(result);
        return;
      }

      const result = await res.json().catch(() => ({}));
      if (res.status === 503) throw new Error("Backend offline");
      throw new Error(result.message || "Unable to confirm booking.");
    } catch (error) {
      // Graceful offline fallback
      const saved = saveBookingLocally({
        id: Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        status: "confirmed_offline",
      });
      reset();
      onSuccess({ name: values.name, ...saved, message: "Request received! We'll confirm via WhatsApp shortly." });
    }
  };

  // Auth guard on submit: if user not logged in, open auth modal then re-submit on success
  const submit = (values) => {
    if (!isAuthenticated) {
      openAuthModal({
        mode: "login",
        message: `Sign in to finalise your booking for ${values.service || "your session"} on ${date}.`,
        onSuccess: () => {
          // After login the form still has data; re-trigger submit programmatically
          doSubmit(values);
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
          <input {...register("phone")} placeholder="+977 98..." />
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
        Custom Notes / Nail Shape &amp; Inspo (Optional)
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
          ? "Sending request..."
          : isAuthenticated
          ? "Confirm Studio Appointment"
          : "Continue & Sign In to Confirm"}{" "}
        <ArrowRight size={16} />
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
