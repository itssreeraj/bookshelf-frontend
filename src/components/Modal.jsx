import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-parchment border border-ink/20 p-6 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 left-6 right-6 h-px bg-stamp-red/40" />
        {title && <h3 className="font-display text-xl text-walnut mt-3 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
