import { Check, X } from "lucide-react";
export default function Toast({ message, error, onClose }) { if (!message) return null; return <div className={`toast ${error ? "toast-error" : ""}`} role="status"><span>{error ? <X size={16} /> : <Check size={16} />}</span>{message}<button onClick={onClose} aria-label="Close notification"><X size={14} /></button></div>; }
