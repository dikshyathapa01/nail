import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const yOffset = -70;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
        return;
      }
    }

    // When navigating to /booking without hash, Booking component handles scrolling to calendar.
    // For other routes, scroll to top instantly so page doesn't stay scrolled down.
    if (pathname !== "/booking") {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
