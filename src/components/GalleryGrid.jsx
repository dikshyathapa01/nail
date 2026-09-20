import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { gallery } from "../data";
import Lightbox from "./Lightbox";
export default function GalleryGrid({ items = gallery }) {
  const [selected, setSelected] = useState(null);
  const close = () => setSelected(null);
  return <><div className="gallery-grid">{items.map((item, index) => <button className={`gallery-item gallery-item-${index % 5}`} key={item.title} onClick={() => setSelected(index)}><img src={item.image} alt={item.title} /><span className="gallery-overlay"><b>{item.title}</b><Maximize2 size={17} /></span></button>)}</div><Lightbox item={selected === null ? null : items[selected]} onClose={close} onNext={() => setSelected((selected + 1) % items.length)} onPrev={() => setSelected((selected - 1 + items.length) % items.length)} /></>;
}
