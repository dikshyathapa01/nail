import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { gallery } from "../data";
import Lightbox from "./Lightbox";
export default function GalleryGrid({ items = gallery }) {
  const [selected, setSelected] = useState(null);
  const close = () => setSelected(null);
  return <><div className="gallery-grid">{items.map((item, index) => <motion.button className={`gallery-item gallery-item-${index % 5}`} key={item.title} onClick={() => setSelected(index)} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}><img src={item.image} alt={item.title} /><span className="gallery-overlay"><b>{item.title}</b><Maximize2 size={17} /></span></motion.button>)}</div><Lightbox item={selected === null ? null : items[selected]} onClose={close} onNext={() => setSelected((selected + 1) % items.length)} onPrev={() => setSelected((selected - 1 + items.length) % items.length)} /></>;
}
