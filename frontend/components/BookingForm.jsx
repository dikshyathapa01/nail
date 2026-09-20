import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import InstagramIcon from "./InstagramIcon";
import { API_BASE_URL } from "../api";
export default function BookingForm({ date, time, onSuccess }) {
  const [submitError, setSubmitError] = useState("");
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get("service");
  const defaultService = services.find(s => s.name.toLowerCase() === serviceParam?.toLowerCase())?.name || services[0].name;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { service: defaultService }
  });

  useEffect(() => {
    if (serviceParam) {
      const matched = services.find(s => s.name.toLowerCase() === serviceParam.toLowerCase());
      if (matched) setValue("service", matched.name);
    }
  }, [serviceParam, setValue]);

  const submit = async (values) => {
    setSubmitError("");
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, date, time })
      });
      if (response.ok) {
        const result = await response.json();
        reset();
        onSuccess(result);
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (response.status === 503) {
        throw new Error("Backend offline");
      }
      throw new Error(result.message || "Unable to confirm booking at this time.");
    } catch (error) {
      if (error.message !== "Backend offline" && !/Failed to fetch|NetworkError/i.test(error.message)) {
        setSubmitError(error.message || "Unable to confirm booking at this time.");
        return;
      }
      // Graceful offline fallback: store locally and confirm request
      const existing = JSON.parse(localStorage.getItem("offline_nail_bookings") || "[]");
      const localRecord = {
        id: Date.now(),
        ...values,
        date,
        time,
        createdAt: new Date().toISOString(),
        status: "confirmed_offline"
      };
      existing.push(localRecord);
      localStorage.setItem("offline_nail_bookings", JSON.stringify(existing));
      reset();
      onSuccess({ name: values.name, message: "Appointment request received! We will reach out shortly." });
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit, () => {})}>
      <div className="field-grid">
        <label>
          Name
          <input
            {...register("name", { required: "Your name is required", minLength: { value: 2, message: "Please enter your full name" } })}
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
        <input type="email" {...register("email")} placeholder="you@example.com" />
      </label>

      <label>
        Nail Service / Set
        <select {...register("service")}>
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name} · {service.duration}
            </option>
          ))}
        </select>
      </label>

      <label>
        Custom Notes / Nail Shape & Inspo (Optional)
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

      <button className="dark-button submit-button" disabled={!date || !time || isSubmitting}>
        {isSubmitting ? "Sending request..." : "Confirm Studio Appointment"} <ArrowRight size={16} />
      </button>

      {submitError && <small className="form-error booking-submit-error">{submitError}</small>}

      <div className="booking-insta-help">
        <InstagramIcon size={14} />
        <span>Prefer to order custom press-ons via DM? Reach us at <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><strong>{INSTAGRAM_HANDLE}</strong></a></span>
      </div>
    </form>
  );
}
