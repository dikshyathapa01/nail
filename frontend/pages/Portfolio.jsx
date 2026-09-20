import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gallery, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import GalleryGrid from "../components/GalleryGrid";
import InstagramIcon from "../components/InstagramIcon";
import EditorialBackground from "../components/EditorialBackground";

const categories = ["All", "Press-Ons", "Nail Art", "Gel & BIAB", "Chrome & French", "Acrylics"];

export default function Portfolio() {
  const [filter, setFilter] = useState("All");

  const items = filter === "All"
    ? gallery
    : gallery.filter((item) => item.category === filter);

  return (
    <section className="page-shell editorial-page-shell" aria-label="Portfolio">
      <EditorialBackground />

      <div className="shell editorial-page-content">
        <motion.div
          className="page-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">
            <Sparkles size={13} /> Our Work & Creative Archive
          </p>
          <h1 className="curated-hero-title" style={{ marginBottom: "16px" }}>
            The archive of<br />
            <em>curated</em> sets<br />
            &amp; nail artistry.
          </h1>
          <p className="curated-hero-desc">
            A curated gallery of authentic sets created by our studio — from delicate BIAB and chrome
            accents to handcrafted reusable press-on kits and 3D floral sculptures.
          </p>

          <div className="services-insta-banner">
            <InstagramIcon size={17} />
            <span>
              Follow our studio on Instagram{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <strong>{INSTAGRAM_HANDLE}</strong>
              </a>{" "}
              for fresh daily nail inspo, video reels, and custom DM orders.
            </span>
          </div>
        </motion.div>

        <motion.div
          className="filter-tabs"
          role="tablist"
          aria-label="Portfolio categories"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          {categories.map((category) => (
            <button
              className={filter === category ? "frosted-tab active" : "frosted-tab"}
              key={category}
              role="tab"
              aria-selected={filter === category}
              onClick={() => setFilter(category)}
            >
              {category} {category === "All" ? `(${gallery.length})` : `(${gallery.filter(i => i.category === category).length})`}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
        >
          <GalleryGrid items={items} />
        </motion.div>

        <motion.div
          className="portfolio-cta-card editorial-frosted-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <span className="eyebrow">Have an inspiration in mind?</span>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "38px", margin: "8px 0 12px" }}>
              Love a set you <em>see here?</em>
            </h2>
            <p>Book an appointment at our Kathmandu studio or order a bespoke reusable press-on set customized to your nail measurements.</p>
          </div>
          <div className="portfolio-cta-actions">
            <Link className="explore-pill-btn" to="/booking">
              Book Appointment <ArrowRight size={15} />
            </Link>
            <a className="frosted-pill-btn" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <InstagramIcon size={15} /> DM on Instagram
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

