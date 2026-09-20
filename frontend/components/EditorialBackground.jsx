import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const sparklesData = [
  { id: 1, top: "15%", left: "75%", size: 7, delay: 0, duration: 4 },
  { id: 2, top: "28%", left: "88%", size: 10, delay: 1, duration: 4.2 },
  { id: 3, top: "45%", left: "62%", size: 6, delay: 2, duration: 3.8 },
  { id: 4, top: "60%", left: "85%", size: 9, delay: 0.5, duration: 4.5 },
  { id: 5, top: "72%", left: "50%", size: 6, delay: 1.5, duration: 3.6 },
  { id: 6, top: "20%", left: "40%", size: 8, delay: 2.2, duration: 4.1 },
  { id: 7, top: "82%", left: "78%", size: 11, delay: 1.2, duration: 4.6 },
];

export default function EditorialBackground() {
  return (
    <>
      {/* Animated Concentric Wave Swooshes */}
      <div className="hero-concentric-bg" aria-hidden="true">
        <motion.svg
          viewBox="0 0 1200 1200"
          className="hero-concentric-svg"
          fill="none"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.circle
            cx="800"
            cy="600"
            r="220"
            stroke="rgba(0, 0, 0, 0.04)"
            strokeWidth="40"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="800"
            cy="600"
            r="340"
            stroke="rgba(0, 0, 0, 0.035)"
            strokeWidth="50"
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.circle
            cx="800"
            cy="600"
            r="480"
            stroke="rgba(0, 0, 0, 0.03)"
            strokeWidth="60"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.circle
            cx="800"
            cy="600"
            r="640"
            stroke="rgba(0, 0, 0, 0.025)"
            strokeWidth="70"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
          <motion.circle
            cx="800"
            cy="600"
            r="820"
            stroke="rgba(0, 0, 0, 0.018)"
            strokeWidth="80"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </motion.svg>
      </div>

      {/* Floating Sparkles & Starbursts */}
      <div className="hero-sparkle-layer" aria-hidden="true">
        {sparklesData.map((s) => (
          <span
            key={s.id}
            className="ambient-sparkle"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
        <motion.div
          className="ambient-star"
          style={{ top: "24%", left: "70%" }}
          animate={{ rotate: 360, scale: [0.8, 1.25, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={16} />
        </motion.div>
        <motion.div
          className="ambient-star"
          style={{ top: "65%", left: "82%" }}
          animate={{ rotate: -360, scale: [0.75, 1.2, 0.75] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <Sparkles size={14} />
        </motion.div>
      </div>
    </>
  );
}
