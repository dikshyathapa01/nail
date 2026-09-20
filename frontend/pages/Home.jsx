import { useState, useEffect } from "react";
import { ArrowRight, Check, Clock3, Heart, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gallery, services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "../data";
import GalleryGrid from "../components/GalleryGrid";
import InstagramIcon from "../components/InstagramIcon";
import bookWithMe from "../assets/book with me.jpg";
import frontNailArt from "../assets/front.jpg";
import EditorialBackground from "../components/EditorialBackground";

export default function Home() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 60, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 15 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth) - 0.5);
    mouseY.set((clientY / innerHeight) - 0.5);
  };

  return (
    <>
      {/* Editorial Curated Hero Section with Smooth Animations */}
      <section
        className="curated-hero-section"
        onMouseMove={handleMouseMove}
        aria-label="Welcome to Nail Inspo"
      >
        <EditorialBackground />

        {/* Main Hero Content Grid */}
        <div className="curated-hero-grid">
          {/* Left Column: Editorial Headline & Subtext */}
          <div className="curated-hero-copy">
            <motion.h1
              className="curated-hero-title"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              The art of<br />
              <em>curated</em> nails<br />
              &amp; lash design.
            </motion.h1>

            <motion.p
              className="curated-hero-desc"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Bespoke nail artistry, lash lifting, brow lamination, and waxing — done
              slowly, carefully, and exactly the way you pictured it. Discover a
              space for mindful beauty.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/portfolio" className="explore-pill-btn">
                EXPLORE DESIGNS
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Manicured Hand Photography with Ethereal Floating Motion */}
          <div className="curated-hero-visual">
            <motion.div
              className="curated-art-wrapper"
              style={{
                rotateX,
                rotateY,
                transformPerspective: 1000,
              }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [-7, 7, -7],
              }}
              transition={{
                opacity: { duration: 0.9, ease: "easeOut" },
                scale: { duration: 0.9, ease: "easeOut" },
                y: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <img
                src={frontNailArt}
                alt="Handcrafted luxury reusable press-on nail sets and couture nail artistry by Nail Inspo"
              />
              <div className="ethereal-glow-overlay" />
              <div className="hero-subtle-badge">
                <Sparkles size={14} />
                <span>Kathmandu Studio & Bespoke Sets</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="service-strip" id="services">
        <div className="shell">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Studio Treatments & Sets</p>
              <h2>Signature services.</h2>
            </div>
            <p>
              From reusable press-on collections to long-wearing BIAB and sculpted gel extensions,
              each service is personalized to perfection.
            </p>
          </div>

          <div className="service-cards">
            {services.slice(0, 8).map((service, index) => (
              <article className="service-card" key={service.name}>
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
                  </footer>
                  <div className="service-card-actions">
                    <Link
                      className="dark-button service-book-btn"
                      to={`/booking?service=${encodeURIComponent(service.name)}`}
                    >
                      Book Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="services-more-cta">
            <Link className="dark-button" to="/services">
              View All Services & Sets <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Selected Work Portfolio */}
      <section className="shell home-portfolio">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Selected Client & Press-On Work</p>
            <h2>A gallery of good ideas.</h2>
          </div>
          <div className="portfolio-header-links">
            <a
              className="text-link"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
            >
              <InstagramIcon size={14} /> Instagram @nailinspo412
            </a>
            <Link className="dark-button" to="/portfolio">
              View Full Portfolio <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <GalleryGrid items={gallery.slice(0, 6)} />
      </section>

      {/* Why Choose Us */}
      <section className="why-section">
        <div className="shell">
          <div className="section-intro">
            <div>
              <p className="eyebrow">The Nail Inspo Approach</p>
              <h2>
                More intention in<br />
                every detail.
              </h2>
            </div>
            <p>
              Every set is created as a personal expression of your mood — whether ready to wear at home
              or sculpted during an in-studio session.
            </p>
          </div>
          <div className="why-grid">
            <article>
              <Sparkles size={24} />
              <h3>Handmade & Original</h3>
              <p>Small-batch handcrafted nail art and press-on sets with thoughtful shapes, colors, and textures.</p>
            </article>
            <article>
              <Heart size={24} />
              <h3>Custom Sizing</h3>
              <p>Each press-on set is tailored precisely to your nail measurements for a natural, seamless fit.</p>
            </article>
            <article>
              <Check size={24} />
              <h3>Reusable & Durable</h3>
              <p>High-grade salon materials and builder gel coatings ensure your sets can be worn again and again.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Booking Banner with authentic Book With Me visual */}
      <section className="booking-banner">
        <div className="shell banner-inner">
          <div className="banner-editorial-card">
            <div className="banner-content">
              <p className="eyebrow">Reserve Your Session</p>
              <h2>Ready for your next set?</h2>
              <p>
                Book an appointment at our Kathmandu studio or order a bespoke set of reusable press-ons
                crafted to your personal design ideas.
              </p>
              <div className="banner-actions">
                <Link className="dark-button" to="/booking">
                  Book Studio Appointment <ArrowRight size={16} />
                </Link>
                <a
                  className="light-button"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <InstagramIcon size={15} /> DM on Instagram
                </a>
              </div>
            </div>
            <div className="banner-image-wrap">
              <img src={bookWithMe} alt="Book an appointment with Nail Inspo" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
