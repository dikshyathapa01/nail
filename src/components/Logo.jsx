import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="brand-editorial" aria-label="Nail Inspo home">
      <span className="brand-text">Nail Inspo.</span>
    </Link>
  );
}

