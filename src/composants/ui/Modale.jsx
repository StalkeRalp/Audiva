export function Modale({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/65 backdrop-blur-md p-4">
      <div className="w-full max-w-lg audiva-glass rounded-[28px] p-6 text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
