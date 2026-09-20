import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import InstagramIcon from "./InstagramIcon";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, STUDIO_PHONE, STUDIO_EMAIL, STUDIO_LOCATION } from "../data";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <Logo />
          <p className="footer-tagline">
            Handcrafted reusable press-on sets, BIAB overlays, gel extensions, and bespoke nail artistry in Kathmandu.
          </p>
          <div className="socials">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon size={17} />
            </a>
          </div>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/services">Services & Sets</Link>
          <Link to="/portfolio">Nail Portfolio</Link>
          <Link to="/booking">Book Appointment</Link>
          <Link to="/contact">Contact & Sizing</Link>
        </div>

        <div>
          <h3>Studio Hours</h3>
          <p>Mon–Fri <span>09:00 – 17:00</span></p>
          <p>Saturday <span>10:00 – 17:00</span></p>
          <p>Sunday <span>By appointment</span></p>
        </div>

        <div>
          <h3>Studio & Orders</h3>
          <p><MapPin size={15} /> {STUDIO_LOCATION}</p>
          <p><Phone size={15} /> {STUDIO_PHONE}</p>
          <p><Mail size={15} /> {STUDIO_EMAIL}</p>
          <p><InstagramIcon size={15} /> {INSTAGRAM_HANDLE}</p>
        </div>
      </div>

      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Nail Inspo.np — All rights reserved.</span>
        <span>Handcrafted nail artistry & reusable press-ons.</span>
      </div>
    </footer>
  );
}
