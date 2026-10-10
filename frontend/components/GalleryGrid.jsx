import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { gallery } from "../data";
import Lightbox from "./Lightbox";
export default function GalleryGrid({ items = gallery, marquee = false, portfolio = false }) {
  const [selected, setSelected] = useState(null);
  const close = () => setSelected(null);
  const displayItems = marquee ? [...items, ...items] : items;
  const galleryItems = displayItems.map((item, index) => <motion.button className={`gallery-item gallery-item-${index % 5}`} key={`${item.title}-${index}`} onClick={() => setSelected(index)} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, delay: (index % items.length) * 0.06, ease: [0.16, 1, 0.3, 1] }}><motion.img src={item.image} alt={item.title} initial={{ opacity: 0, scale: 1.06 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.75, delay: (index % items.length) * 0.06, ease: [0.16, 1, 0.3, 1] }} /><span className="gallery-overlay"><b>{item.title}</b><Maximize2 size={17} /></span></motion.button>);

  const galleryClassName = marquee
    ? "gallery-marquee"
    : portfolio
      ? "gallery-grid portfolio-gallery-grid"
      : "gallery-grid";
  const content = marquee
    ? <div className="gallery-marquee-track">{galleryItems}</div>
    : galleryItems;

  return <><div className={galleryClassName}>{content}</div><Lightbox item={selected === null ? null : displayItems[selected]} onClose={close} onNext={() => setSelected((selected + 1) % displayItems.length)} onPrev={() => setSelected((selected - 1 + displayItems.length) % displayItems.length)} /></>;
}
