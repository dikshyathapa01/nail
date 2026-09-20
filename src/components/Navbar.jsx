import { Menu, X, ArrowUpRight, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo";
import { INSTAGRAM_HANDLE } from "../data";

const links = [
  ["PORTFOLIO", "/portfolio"],
  ["SERVICES", "/services"],
  ["CONTACT", "/contact"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar editorial-navbar">
      <div className="shell nav-inner">
        <Logo />
        <nav className="desktop-nav editorial-nav" aria-label="Primary navigation">
          {links.map(([label, to]) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <Link to="/booking" className="frosted-pill-btn nav-book-btn">
            BOOK NOW
          </Link>
        </div>
        <button
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="mobile-nav">
          {links.map(([label, to]) => (
            <Link key={label} to={to} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            className="frosted-pill-btn mobile-book-btn"
            to="/booking"
            onClick={() => setOpen(false)}
          >
            BOOK NOW
          </Link>
        </nav>
      )}
    </header>
  );
}
