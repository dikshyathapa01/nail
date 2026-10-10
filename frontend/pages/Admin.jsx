import { useEffect, useState } from "react";
import { Bell, CalendarDays, ImagePlus, Plus, Trash2, Upload, ShieldCheck, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";

const fallbackCategories = ["Press-Ons", "Nail Art", "Gel & BIAB", "Chrome & French", "Acrylics"];

export default function Admin({ initialTab = "overview" }) {
  const { user, adminToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [serviceForm, setServiceForm] = useState({ name: "", duration: "", description: "", price: "" });
  const [serviceFile, setServiceFile] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceImageUrl, setServiceImageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointmentView, setAppointmentView] = useState("today");
  const [serviceLoadError, setServiceLoadError] = useState("");

  const adminHeaders = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  const loadData = async () => {
    if (!adminToken) throw new Error("Your admin session has expired. Please sign in again.");
    const [galleryResponse, categoryResponse, appointmentResponse, servicesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/gallery`),
      fetch(`${API_BASE_URL}/categories`),
      fetch(`${API_BASE_URL}/bookings/admin`, { headers: adminHeaders }),
      fetch(`${API_BASE_URL}/services`),
    ]);
    const failedResponse = [
      ["photos", galleryResponse],
      ["categories", categoryResponse],
      ["appointments", appointmentResponse],
    ].find(([, response]) => !response.ok);
    if (failedResponse) {
      const [resource, response] = failedResponse;
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Your admin session has expired. Please sign in again.");
      throw new Error(result.message || `Unable to load ${resource}.`);
    }
    const [galleryItems, categoryItems, bookingItems] = await Promise.all([
      galleryResponse.json(), categoryResponse.json(), appointmentResponse.json(),
    ]);
    const serviceItems = servicesResponse.ok ? await servicesResponse.json() : [];
    setServiceLoadError(servicesResponse.ok ? "" : `Services API is unavailable (${servicesResponse.status}). Redeploy the backend to enable service management.`);
    setItems(galleryItems);
    const names = categoryItems.map((item) => item.name);
    setCategories(names.length ? categoryItems : fallbackCategories.map((name) => ({ id: null, name })));
    setCategory((current) => current || names[0] || fallbackCategories[0]);
    setAppointments(bookingItems);
    setServices(serviceItems);
    const serviceToEdit = editId && serviceItems.find((item) => item.id === editId);
    if (serviceToEdit) {
      setEditingServiceId(serviceToEdit.id);
      setServiceForm({
        name: serviceToEdit.name,
        duration: serviceToEdit.duration,
        description: serviceToEdit.description,
        price: String(serviceToEdit.price),
      });
      setCategory(serviceToEdit.category);
      setServiceImageUrl(serviceToEdit.image?.startsWith("http") ? serviceToEdit.image : "");
      setTab("services");
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) return;
    loadData().catch((loadError) => setError(loadError.message));
    const refreshTimer = window.setInterval(() => {
      loadData().catch(() => {});
    }, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [isAuthenticated, user?.isAdmin, adminToken, editId]);

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <section className="page-shell editorial-page-shell">
        <div className="shell admin-locked editorial-frosted-card">
          <ShieldCheck size={34} />
          <h1>Admin access only</h1>
          <p>Sign in with an administrator account to manage the studio.</p>
          <button className="dark-button" onClick={() => navigate("/")}>Return home</button>
        </div>
      </section>
    );
  }

  const retryLoad = () => {
    setError("");
    loadData().catch((loadError) => setError(loadError.message));
  };

  const run = async (action, success) => {
    setError(""); setMessage(""); setLoading(true);
    try { await action(); await loadData(); setMessage(success); }
    catch (actionError) { setError(actionError.message); }
    finally { setLoading(false); }
  };

  const addPhoto = (event) => {
    event.preventDefault();
    if (!file) return setError("Choose a photo to upload.");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("image", file);
    return run(async () => {
      const response = await fetch(`${API_BASE_URL}/gallery`, { method: "POST", headers: adminHeaders, body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Upload failed.");
      setTitle(""); setFile(null); event.target.reset();
    }, "Photo added to the public portfolio.");
  };

  const addCategory = (event) => {
    event.preventDefault();
    return run(async () => {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST", headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not add category.");
      setNewCategory("");
    }, "Service category added.");
  };

  const addService = (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries({ ...serviceForm, category, imageUrl: serviceImageUrl }).forEach(([key, value]) => formData.append(key, value));
    if (serviceFile) formData.append("image", serviceFile);
    return run(async () => {
      const response = await fetch(`${API_BASE_URL}/admin/services${editingServiceId ? `/${editingServiceId}` : ""}`, { method: editingServiceId ? "PUT" : "POST", headers: adminHeaders, body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not add service.");
      setServiceForm({ name: "", duration: "", description: "", price: "" });
      setServiceFile(null);
      setServiceImageUrl("");
      setEditingServiceId(null);
      event.target.reset();
    }, "Service added to the public services page.");
  };

  const updateBookingStatus = (id, status) => run(async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/admin/${id}/status`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Could not update appointment.");
  }, "Appointment status updated.");

  const editService = (service) => {
    setTab("services");
    setEditingServiceId(service.id);
    setServiceForm({ name: service.name, duration: service.duration, description: service.description, price: String(service.price) });
    setCategory(service.category);
    setServiceImageUrl(service.image?.startsWith("http") ? service.image : "");
  };

  const remove = (url, success) => run(async () => {
    const response = await fetch(url, { method: "DELETE", headers: adminHeaders });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Delete failed.");
  }, success);

  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const visibleAppointments = appointmentView === "today"
    ? appointments.filter((appointment) => String(appointment.date || appointment.booking_date || "").slice(0, 10) === today)
    : appointments;
  return (
    <section className="page-shell editorial-page-shell">
      <div className="shell admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <p className="eyebrow"><ShieldCheck size={13} /> Private studio workspace</p>
            <h1 className="curated-hero-title">Good morning,<br /><em>{user.name.split(" ")[0]}.</em></h1>
            <p className="curated-hero-desc">Manage your nail archive, services, and appointment requests in one place.</p>
          </div>
          <div className="admin-notification-card"><Bell size={18} /><strong>{pendingCount}</strong><span>pending appointments</span></div>
        </div>
        <div className="admin-tabs">
          {[["overview", "Overview"], ["gallery", "Nail photos"], ["services", "Services"], ["appointments", "Appointments"]].map(([value, label]) => (
            <button key={value} className={tab === value ? "frosted-tab active" : "frosted-tab"} onClick={() => setTab(value)}>
              {value === "appointments" && pendingCount > 0 ? `${label} (${pendingCount})` : label}
            </button>
          ))}
        </div>
        {error && <div className="admin-feedback error"><span>{error}</span><button type="button" className="frosted-pill-btn" onClick={retryLoad}>Retry</button></div>}
        {message && <p className="admin-feedback">{message}</p>}
        {serviceLoadError && tab === "services" && <p className="admin-feedback error">{serviceLoadError}</p>}

        {(tab === "overview" || tab === "gallery") && (
          <div className="admin-section-grid">
            <form className="admin-upload-card editorial-frosted-card" onSubmit={addPhoto}>
              <div className="admin-card-heading"><ImagePlus size={20} /><div><h2>Add a new nail photo</h2><p>JPG, PNG, WEBP, or GIF · 5 MB maximum</p></div></div>
              <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Cherry chrome tips" required /></label>
              <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)} required>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
              <label className="admin-file-field">Photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label>
              <button className="dark-button" disabled={loading}><Upload size={15} /> {loading ? "Uploading..." : "Add photo"}</button>
            </form>
            <div className="admin-saved editorial-frosted-card"><h2>Saved photos <span>{items.length}</span></h2><div className="admin-photo-grid">
              {items.map((item) => <article className="admin-photo-card" key={item.id}><img src={item.image} alt={item.title} /><div><strong>{item.title}</strong><small>{item.category}</small><button type="button" onClick={() => remove(`${API_BASE_URL}/gallery/${item.id}`, "Photo removed.")}><Trash2 size={15} /></button></div></article>)}
            </div></div>
          </div>
        )}

        {(tab === "overview" || tab === "services") && (
          <section className="admin-management-card editorial-frosted-card">
            <div className="admin-card-heading"><Scissors size={20} /><div><h2>Add a studio service</h2><p>New services appear on the public services page.</p></div></div>
            <form className="admin-service-form" onSubmit={addService}>
              <input placeholder="Service name" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required />
              <select value={category} onChange={(event) => setCategory(event.target.value)} required>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
              <input placeholder="Duration (e.g. 60 mins)" value={serviceForm.duration} onChange={(event) => setServiceForm({ ...serviceForm, duration: event.target.value })} required />
              <input type="number" min="0" step="0.01" placeholder="Price" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} required />
              <textarea placeholder="Description" value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} required />
              <input placeholder="Image URL (optional)" value={serviceImageUrl} onChange={(event) => { setServiceImageUrl(event.target.value); setServiceForm({ ...serviceForm, imageUrl: event.target.value }); }} />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setServiceFile(event.target.files?.[0] || null)} />
              <button className="dark-button" disabled={loading}><Plus size={15} /> {editingServiceId ? "Update service" : "Add service"}</button>
            </form>
            <div className="admin-service-list">{services.map((item) => <div key={item.id}><div><strong>{item.name}</strong><small>{item.category} · {item.duration} · {item.price}</small></div><span><button type="button" onClick={() => editService(item)}>Edit</button><button type="button" onClick={() => remove(`${API_BASE_URL}/services/${item.id}`, "Service removed.")}><Trash2 size={15} /></button></span></div>)}</div>
            <div className="admin-card-heading" style={{ marginTop: "30px" }}><Plus size={20} /><div><h2>Service categories</h2><p>These categories appear on the public services and portfolio pages.</p></div></div>
            <form className="admin-inline-form" onSubmit={addCategory}><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Luxury nail art" required /><button className="dark-button" disabled={loading}>Add category</button></form>
            <div className="admin-category-list">{categories.map((item) => <div key={item.id || item.name}><span>{item.name}</span>{item.id && <button type="button" onClick={() => remove(`${API_BASE_URL}/categories/${item.id}`, "Category removed.")}><Trash2 size={15} /></button>}</div>)}</div>
          </section>
        )}

        {(tab === "overview" || tab === "appointments") && (
          <section className="admin-management-card editorial-frosted-card">
            <div className="admin-card-heading"><CalendarDays size={20} /><div><h2>Appointment requests</h2><p>New requests are also sent to the configured studio notification email.</p></div></div>
            <div className="admin-appointment-toolbar"><button type="button" className={appointmentView === "today" ? "frosted-tab active" : "frosted-tab"} onClick={() => setAppointmentView("today")}>Today</button><button type="button" className={appointmentView === "all" ? "frosted-tab active" : "frosted-tab"} onClick={() => setAppointmentView("all")}>All appointments</button></div>
            <div className="admin-appointments">{visibleAppointments.length === 0 ? <p>{appointmentView === "today" ? "No appointments scheduled for today." : "No appointment requests yet."}</p> : visibleAppointments.map((appointment) => <article key={appointment.id}><div><strong>{appointment.name}</strong><span>{appointment.phone || "No phone"} · {appointment.email || "No email"}</span><span>{appointment.service} · {appointment.date || appointment.booking_date} at {appointment.time}</span><small>{appointment.notes || "No notes"}</small></div><div className="admin-appointment-actions"><b className={`status-${appointment.status}`}>{appointment.status}</b><select value={appointment.status} onChange={(event) => updateBookingStatus(appointment.id, event.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></article>)}</div>
          </section>
        )}
      </div>
    </section>
  );
}
