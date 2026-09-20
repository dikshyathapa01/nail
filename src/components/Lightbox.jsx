import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
export default function Lightbox({ item, onClose, onNext, onPrev }) {
  useEffect(() => { const key = (event) => { if (event.key === "Escape") onClose(); if (event.key === "ArrowRight") onNext(); if (event.key === "ArrowLeft") onPrev(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [onClose, onNext, onPrev]);
  return <AnimatePresence>{item && <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><button className="lightbox-close" onClick={onClose} aria-label="Close"><X /></button><button className="lightbox-arrow prev" onClick={(event) => { event.stopPropagation(); onPrev(); }} aria-label="Previous"><ChevronLeft /></button><motion.figure initial={{ scale: .92 }} animate={{ scale: 1 }} onClick={(event) => event.stopPropagation()}><img src={item.image} alt={item.title} /><figcaption>{item.title} <span>{item.category}</span></figcaption></motion.figure><button className="lightbox-arrow next" onClick={(event) => { event.stopPropagation(); onNext(); }} aria-label="Next"><ChevronRight /></button></motion.div>}</AnimatePresence>;
}
