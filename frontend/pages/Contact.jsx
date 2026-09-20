import { ArrowRight, Mail, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, STUDIO_PHONE, STUDIO_EMAIL } from "../data";
import InstagramIcon from "../components/InstagramIcon";
import EditorialBackground from "../components/EditorialBackground";

export default function Contact() {
  return (
    <section className="page-shell editorial-page-shell contact-page" aria-label="Contact">
      <EditorialBackground />

      <div className="shell editorial-page-content">
        <motion.div
          className="page-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">
            <Sparkles size={13} /> Studio & Order Inquiries · Kathmandu
          </p>
          <h1 className="curated-hero-title" style={{ marginBottom: "16px" }}>
            Get in touch<br />
            for <em>bespoke sets</em><br />
            &amp; studio visits.
          </h1>
          <p className="curated-hero-desc">
            Need help sizing a custom reusable press-on kit, asking about nail designs,
            or scheduling an in-studio appointment? We are here to help you get the exact set you love.
          </p>

          <div style={{ marginTop: "24px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link className="explore-pill-btn" to="/booking">
              Book Appointment <ArrowRight size={15} />
            </Link>
            <a className="frosted-pill-btn" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <InstagramIcon size={15} /> DM on Instagram
            </a>
          </div>
        </motion.div>

        <div className="contact-layout">
          <motion.div
            className="contact-details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <a href={`tel:${STUDIO_PHONE.replace(/\s+/g, '')}`} className="editorial-frosted-card">
              <Phone size={20} />
              <div>
                <small>Call / WhatsApp</small>
                <span>{STUDIO_PHONE}</span>
              </div>
            </a>
            <a href={`mailto:${STUDIO_EMAIL}`} className="editorial-frosted-card">
              <Mail size={20} />
              <div>
                <small>Email Inquiries</small>
                <span>{STUDIO_EMAIL}</span>
              </div>
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="editorial-frosted-card">
              <InstagramIcon size={20} />
              <div>
                <small>Instagram Studio & Updates</small>
                <span>{INSTAGRAM_HANDLE}</span>
              </div>
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

