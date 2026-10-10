import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import InstagramIcon from "../components/InstagramIcon";
import EditorialBackground from "../components/EditorialBackground";
import { API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";

export default function Services() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All", "Press-Ons", "Nail Art", "Gel & Extensions", "Acrylics"]);
  const [dynamicServices, setDynamicServices] = useState([]);
  const { user, adminToken } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

  const deleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!response.ok) throw new Error("Unable to delete service.");
    setDynamicServices((current) => current.filter((service) => service.id !== id));
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load categories")))
      .then((items) => {
        if (Array.isArray(items) && items.length) setCategories(["All", ...items.map((item) => item.name)]);
      })
      .catch(() => {});
    fetch(`${API_BASE_URL}/services`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load services")))
      .then((items) => { if (Array.isArray(items)) setDynamicServices(items); })
      .catch(() => {});
  }, []);

  const allServices = [...dynamicServices, ...services];
  const filteredServices = selectedCategory === "All"
    ? allServices
    : allServices.filter((s) => s.category === selectedCategory);

  return (
    <section className="page-shell editorial-page-shell" aria-label="Services">
      <EditorialBackground />

      <div className="shell editorial-page-content">
        <motion.div
          className="page-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">
            <Sparkles size={13} /> Studio Menu & Custom Press-On Sets
          </p>
          <h1 className="curated-hero-title" style={{ marginBottom: "16px" }}>
            The art of<br />
            <em>studio nail</em><br />
            &amp; lash services.
          </h1>
          <p className="curated-hero-desc">
            From tailor-fit reusable press-ons and durable BIAB overlays to sculpted gel extensions
            and intricate 3D chrome details, explore our full menu of dedicated nail services.
          </p>
          <div className="services-insta-banner">
            <InstagramIcon size={17} />
            <span>
              Looking for custom nail inspo? DM your designs to{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <strong>{INSTAGRAM_HANDLE}</strong>
              </a>
            </span>
          </div>
        </motion.div>

        <motion.div
          className="filter-tabs"
          role="tablist"
          aria-label="Service categories"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              className={selectedCategory === cat ? "frosted-tab active" : "frosted-tab"}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} {cat === "All" ? `(${allServices.length})` : `(${allServices.filter(s => s.category === cat).length})`}
            </button>
          ))}
        </motion.div>

        <motion.div
          className="service-cards services-page-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
        >
          {filteredServices.map((service, index) => (
            <article className="service-card editorial-frosted-card" key={service.name}>
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="service-category-badge">{service.category}</span>
              <div className="service-image-wrap">
                <img src={service.image} alt={service.name} loading="lazy" />
              </div>
              <div className="service-card-body">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <footer>
                  <span className="service-duration-pill">
                    <Clock3 size={13} /> {service.duration}
                  </span>
                  {service.price !== undefined && <span className="service-duration-pill">Rs. {service.price}</span>}
                </footer>
                <div className="service-card-actions">
                  {isAdmin && service.id ? (
                    <>
                      <Link className="explore-pill-btn service-book-btn" to={`/admin/services?edit=${service.id}`}>Edit Service</Link>
                      <button className="frosted-pill-btn service-book-btn" type="button" onClick={() => deleteService(service.id)}>Delete</button>
                    </>
                  ) : isAdmin ? (
                    <span className="service-duration-pill">Built-in service</span>
                  ) : (
                    <Link className="explore-pill-btn service-book-btn" to={`/booking?service=${encodeURIComponent(service.name)}#booking-calendar-section`}>
                      Book Appointment <ArrowRight size={14} style={{ marginLeft: "6px" }} />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
