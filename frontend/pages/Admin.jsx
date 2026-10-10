import { useEffect, useState } from "react";
import { ImagePlus, Trash2, Upload, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

const categories = ["Press-Ons", "Nail Art", "Gel & BIAB", "Chrome & French", "Acrylics"];

export default function Admin() {
  const { user, adminToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[1]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadItems = () => fetch(`${API_BASE_URL}/gallery`).then((response) => response.json()).then(setItems);
  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) return;
    loadItems().catch(() => setError("Unable to load saved gallery items."));
  }, [isAuthenticated, user?.isAdmin]);

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <section className="page-shell editorial-page-shell">
        <div className="shell admin-locked editorial-frosted-card">
          <ShieldCheck size={34} />
          <h1>Admin access only</h1>
          <p>Sign in with an administrator account to manage studio photos.</p>
          <button className="dark-button" onClick={() => navigate("/")}>Return home</button>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!file) {
      setError("Choose a photo to upload.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("image", file);
      const response = await fetch(`${API_BASE_URL}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Upload failed.");
      setTitle("");
      setFile(null);
      event.target.reset();
      setMessage("Photo added to the portfolio.");
      await loadItems();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm("Remove this photo from the portfolio?")) return;
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!response.ok) {
      setError("Unable to remove that photo.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className="page-shell editorial-page-shell">
      <div className="shell admin-page">
        <div className="page-heading">
          <p className="eyebrow"><ShieldCheck size={13} /> Studio administration</p>
          <h1 className="curated-hero-title">Add a fresh<br /><em>nail story.</em></h1>
          <p className="curated-hero-desc">Upload finished sets and they will appear at the front of the public portfolio.</p>
        </div>
        <form className="admin-upload-card editorial-frosted-card" onSubmit={handleSubmit}>
          <div className="admin-card-heading"><ImagePlus size={20} /><div><h2>New portfolio photo</h2><p>JPG, PNG, WEBP, or GIF · 5 MB maximum</p></div></div>
          <div className="admin-form-grid">
            <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Cherry chrome tips" required /></label>
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="admin-file-field">Photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label>
          {(error || message) && <p className={error ? "admin-feedback error" : "admin-feedback"}>{error || message}</p>}
          <button className="dark-button" type="submit" disabled={loading}>{loading ? "Uploading..." : <><Upload size={15} /> Add photo</>}</button>
        </form>
        <div className="admin-saved">
          <h2>Saved photos <span>{items.length}</span></h2>
          <div className="admin-photo-grid">
            {items.map((item) => <article className="admin-photo-card" key={item.id}><img src={item.image} alt={item.title} /><div><strong>{item.title}</strong><small>{item.category}</small><button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button></div></article>)}
          </div>
        </div>
      </div>
    </section>
  );
}
